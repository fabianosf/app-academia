# Forma com Fabiano

Aplicativo fitness para treinar em casa, na academia ou nos dois ambientes. Interface em português do Brasil, com planos guiados, execução de treino, aulas ao vivo (demonstração), assistente Nina e análise de movimento demonstrativa.

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (geralmente http://localhost:5173).

## Rotas

- `/` dashboard
- `/onboarding` configuração do plano
- `/treinos` catálogo
- `/treinos/:id` detalhe
- `/treino/:id/executar` execução
- `/ao-vivo` hub de aulas
- `/ao-vivo/:id` sala demonstrativa
- `/progresso`
- `/nina`
- `/analise-movimento`
- `/perfil`
- `/admin`

## Observações

- Dados locais e mockados. Sem backend.
- A sala ao vivo e a análise por câmera são interfaces demonstrativas.
- A câmera só é solicitada após clique e consentimento. Imagens não são armazenadas.
- O conteúdo é educativo e não substitui avaliação profissional.
