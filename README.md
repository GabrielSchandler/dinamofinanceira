# Dínamo Consultoria Financeira

Landing page em português, com layout responsivo, cena 3D controlada pela rolagem, menu mobile, dúvidas expansíveis, política de privacidade e formulário que prepara uma mensagem no WhatsApp.

## Abrir localmente

Execute `node preview.mjs` e abra o endereço impresso no terminal. A porta é escolhida automaticamente. Não há dependências a instalar: as bibliotecas estão em `dist/vendor/`. Um servidor HTTP é necessário para carregar os módulos da cena 3D.

## Animação do topo

- Desktop: barras, seta e faixa em Three.js, com separação e recomposição ligadas ao scroll por GSAP ScrollTrigger. Os textos e os botões continuam em HTML.
- Celular em orientação vertical: a mesma cena 3D, com o movimento original reduzido e posicionada abaixo dos textos.
- Preferência por movimento reduzido: cena estática. Sem WebGL: imagem alternativa.
- A renderização 3D pausa quando o topo sai da tela ou a aba fica oculta; a iluminação ambiente é atualizada em até 30 quadros por segundo. Alterações de scroll continuam solicitando renderização imediatamente.
- O palco usa o mesmo posicionamento sticky do protótipo: 40vh extras no desktop e 32vh no celular. A timeline mantém as distâncias originais de 60% e 52% da altura da tela. Ao rolar para cima, as peças se recompõem.
- Montagem inicial e deslocamento das peças seguem o protótipo. A seta tem extrusão e chanfros; as barras combinam faces de pedra com molduras metálicas, e as três faixas têm espessura e torção. Os materiais usam texturas procedurais de pedra e metal escovado, sombras e um ambiente de estúdio.
- O piso usa reflexão planar real com o Reflector oficial do Three.js r186, suavizada por mipmaps e modulada pela textura da pedra. A resolução do reflexo é limitada a 512 pixels no celular e 1024 no desktop.
- Durante a inicialização, apenas o fundo grafite aparece atrás do texto. O canvas é exibido depois do primeiro quadro renderizado, evitando a troca visível entre a imagem e as peças. A imagem permanece disponível sem JavaScript/WebGL, em falhas de carregamento ou perda do contexto gráfico; uma espera máxima de 12 segundos também libera a imagem alternativa.
- `dist/hero-scene.js` contém geometria, iluminação, composição e animação; `dist/hero-surfaces.js` concentra materiais, texturas e reflexo. Os módulos oficiais do Three.js ficam em `dist/vendor/jsm/`. A folha `dist/hero-prototype.css` isola a apresentação do topo e preserva os textos e contatos da Dínamo.

## Seções abaixo do topo

- `dist/lower-page.css` dá às soluções, ao processo, ao atendimento e às dúvidas uma sequência visual própria, com faixas claras e escuras, mantendo o foco no WhatsApp e no formulário.
- Com movimento permitido, os elementos entram de forma escalonada; a linha do processo acompanha a rolagem e a foto de atendimento se desloca discretamente. Com movimento reduzido, todo o conteúdo permanece visível e a linha aparece completa.
- A foto de atendimento é a versão ilustrativa mais natural fornecida pelo usuário, servida em WebP e carregada apenas quando necessária. A textura de identidade fornecida pelo usuário também aparece na faixa sobre o contrato.

## Atendimento

- WhatsApp: (11) 97018-2723.
- Instagram: https://www.instagram.com/consultoriadinamo/.
- E-mail: dinamoconsultoriafinanceira@gmail.com.
- A análise do contrato é gratuita. Eventuais serviços posteriores devem ter valores e condições explicados antes da contratação.
- Modalidades: financiamento de veículos, imóveis e energia solar, além de empréstimos PF e PJ.
- O formulário não envia mensagens automaticamente: o visitante confirma o envio no WhatsApp.
- O formulário não grava os dados em banco de dados próprio ou no armazenamento do navegador.
- Não há analytics ou pixels configurados. As fontes usam Google Fonts, com alternativas locais.

## Informações pendentes

CNPJ, endereço, condições comerciais e eventuais depoimentos verificados devem ser fornecidos pela empresa antes de uma divulgação pública definitiva. Não foram inventados números de atendimento, resultados, clientes ou avaliações.

## Imagens e referências

- Logo original fornecido pelo usuário, preservado em `brand-original.png`.
- A assinatura dourada usada no cabeçalho e rodapé foi derivada da imagem original com fundo transparente e otimizada em `dist/assets/dinamo-wordmark.webp` (1200 x 400, 132 KB). A imagem original continua preservada; para reprodução absolutamente fiel em outros suportes, solicite o arquivo vetorial da marca.
- Imagens de identidade, atendimento e textura fornecidas pelo usuário. A nova cena de atendimento foi comprimida para WebP sem alterar sua composição; está identificada como ilustrativa e não é apresentada como fotografia da equipe ou da sede real.
- Ícones: Lucide (licença ISC). Biblioteca preservada localmente, incluindo seu aviso de licença.
- Logotipos do WhatsApp e Instagram: Simple Icons, armazenados localmente em SVG.
- Three.js: licença MIT em `dist/vendor/three-LICENSE.txt`. GSAP e ScrollTrigger: avisos e endereço da licença preservados nos cabeçalhos das bibliotecas.
- Referências de estrutura fornecidas pelo usuário: https://www.grssolucao.com.br/ e https://www.atlasnegociacoes.com.br/. Texto e identidade desta versão foram escritos para a Dínamo.
