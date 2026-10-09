"""Adapter de pesquisa web — nunca finge sucesso sem configuração."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from django.conf import settings


@dataclass
class SearchHit:
    title: str
    url: str
    authorship: str
    snippet: str


class WebSearchProvider(Protocol):
    def search(self, query: str, *, max_results: int = 5) -> list[SearchHit]:
        ...


class NullWebSearch:
    """Provider nulo: pesquisa não configurada."""

    def search(self, query: str, *, max_results: int = 5) -> list[SearchHit]:
        raise WebSearchNotConfigured(
            "Pesquisa web não configurada. Defina WEB_SEARCH_PROVIDER e "
            "WEB_SEARCH_API_KEY no .env."
        )


class WebSearchNotConfigured(Exception):
    pass


class HttpWebSearch:
    """
    Provider HTTP genérico (POST JSON).
    Espera WEB_SEARCH_BASE_URL e envia:
      { "query": "...", "max_results": N, "api_key": "..." }
    Resposta esperada:
      { "results": [ { "title", "url", "authorship"?, "snippet"? } ] }
    """

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def search(self, query: str, *, max_results: int = 5) -> list[SearchHit]:
        import json
        import urllib.error
        import urllib.request

        payload = json.dumps(
            {"query": query, "max_results": max_results, "api_key": self.api_key}
        ).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/search",
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise WebSearchNotConfigured(
                "Falha ao contactar o serviço de pesquisa configurado."
            ) from exc

        hits: list[SearchHit] = []
        for row in data.get("results") or []:
            url = (row.get("url") or "").strip()
            title = (row.get("title") or "").strip()
            if not url or not title:
                continue
            hits.append(
                SearchHit(
                    title=title[:512],
                    url=url[:1024],
                    authorship=(row.get("authorship") or row.get("source") or "")[:255],
                    snippet=(row.get("snippet") or row.get("summary") or "")[:2000],
                )
            )
        return hits[:max_results]


def get_web_search_provider() -> WebSearchProvider:
    provider = (getattr(settings, "WEB_SEARCH_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "WEB_SEARCH_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "WEB_SEARCH_BASE_URL", "") or "").strip()
    if provider in ("", "none", "null"):
        return NullWebSearch()
    if provider == "http" and api_key and base_url:
        return HttpWebSearch(base_url, api_key)
    return NullWebSearch()


def is_web_search_configured() -> bool:
    provider = (getattr(settings, "WEB_SEARCH_PROVIDER", "") or "").strip().lower()
    api_key = (getattr(settings, "WEB_SEARCH_API_KEY", "") or "").strip()
    base_url = (getattr(settings, "WEB_SEARCH_BASE_URL", "") or "").strip()
    return provider == "http" and bool(api_key and base_url)
