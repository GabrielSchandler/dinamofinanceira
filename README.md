# Dínamo Consultoria Financeira

Landing page em português, com layout responsivo, cena 3D controlada pela rolagem, menu mobile, dúvidas expansíveis, política de privacidade e formulário que prepara uma mensagem no WhatsApp.

## Abrir localmente

Execute `node preview.mjs` e abra o endereço impresso no terminal. A porta é escolhida automaticamente. Não há dependências a instalar: as bibliotecas estão em `dist/vendor/`. Um servidor HTTP é necessário para carregar os módulos da cena 3D.

## Animação do topo

- Desktop: barras, seta e faixa em Three.js, com separação e recomposição ligadas ao scroll por GSAP ScrollTrigger. Os textos e os botões continuam em HTML.
- Celular em orientação vertical: a mesma cena 3D, com o movimento original reduzido e posicionada abaixo dos textos.
- Preferência por movimento reduzido: cena estática. Sem WebGL: imagem alternativa.
- A renderização 3D pausa quando o topo sai da tela ou a aba fica oculta.
- O palco usa o mesmo posicionamento sticky do protótipo: 40vh extras no desktop e 32vh no celular. A timeline mantém as distâncias originais de 60% e 52% da altura da tela. Ao rolar para cima, as peças se recompõem.
- Montagem inicial e deslocamento das peças seguem o protótipo. A versão atual da cena acrescenta sombras reais, reflexos de um estúdio de luz quente, brilho (bloom) nas arestas e parede/piso desenhados no próprio canvas, que passou a ser opaco.
- `dist/hero-scene.js` é o `main.js` do protótipo na versão com iluminação e sombras melhoradas; os módulos de pós-processamento do Three.js ficam em `dist/vendor/jsm/`. A folha `dist/hero-prototype.css` isola a apresentação original do topo; mantém o fundo grafite e os textos e contatos da Dínamo.

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
