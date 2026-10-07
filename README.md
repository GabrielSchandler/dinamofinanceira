# Dínamo Consultoria Financeira

Landing page em português, com layout responsivo, cena 3D controlada pela rolagem, menu mobile, dúvidas expansíveis, política de privacidade e formulário que prepara uma mensagem no WhatsApp.

## Abrir localmente

Execute `node preview.mjs` e abra o endereço impresso no terminal. A porta é escolhida automaticamente. Não há dependências a instalar: as bibliotecas estão em `dist/vendor/`. Um servidor HTTP é necessário para carregar os módulos da cena 3D.

## Animação do topo

- Desktop: barras, seta e faixa em Three.js, com separação e recomposição ligadas ao scroll por GSAP ScrollTrigger. Os textos e os botões continuam em HTML.
- Telas até 850 px: vídeo local de 6 segundos, sem som. A cena 3D não é carregada.
- Preferência por movimento reduzido, economia de dados ou falta de WebGL: imagem estática.
- A renderização 3D e o vídeo pausam quando o topo sai da tela ou a aba fica oculta.
- O efeito não cria telas extras de rolagem e mantém a seção seguinte visível na abertura.
- `dist/hero-scene.js` adapta o protótipo fornecido pelo usuário, originalmente feito no Claude. Geometria, luz, intensidade e transição ficam nesse arquivo.

## Atendimento

- WhatsApp: (11) 97018-2723.
- E-mail: dinamoconsultoriafinanceira@gmail.com.
- O formulário não envia mensagens automaticamente: o visitante confirma o envio no WhatsApp.
- O formulário não grava os dados em banco de dados próprio ou no armazenamento do navegador.
- Não há analytics ou pixels configurados. As fontes usam Google Fonts, com alternativas locais.

## Informações pendentes

CNPJ, endereço, condições comerciais e eventuais depoimentos verificados devem ser fornecidos pela empresa antes de uma divulgação pública definitiva. Não foram inventados números de atendimento, resultados, clientes ou avaliações.

## Imagens e referências

- Logo original fornecido pelo usuário, preservado em `brand-original.png`.
- Imagens de identidade, atendimento e textura fornecidas pelo usuário, preservadas sem alteração de conteúdo. A cena de atendimento está identificada como ilustrativa e não é apresentada como fotografia da equipe ou da sede real.
- Ícones: Lucide (licença ISC). Biblioteca preservada localmente, incluindo seu aviso de licença.
- Three.js: licença MIT em `dist/vendor/three-LICENSE.txt`. GSAP e ScrollTrigger: avisos e endereço da licença preservados nos cabeçalhos das bibliotecas.
- Referências de estrutura fornecidas pelo usuário: https://www.grssolucao.com.br/ e https://www.atlasnegociacoes.com.br/. Texto e identidade desta versão foram escritos para a Dínamo.
