# Evidências reais — Atividade 2 / Foco v2.0

Este documento registra evidências e pendências. Itens marcados correspondem a execuções reais e têm referências abaixo. **Instalação e uso físico continuam desmarcados**, pois ainda não há essas evidências. Capturas ilustrativas, interfaces geradas, logs inventados e resultados da versão 1.0 não comprovam a versão 2.

## Identificação da execução

| Dado | Registro |
| --- | --- |
| Data/hora da coleta automatizada | 30/10/2026, 19h31min36s, horário de São Paulo (`-03:00`) |
| Responsável pela execução | Pendente |
| Commit/tag testados | Árvore de trabalho Foco 2.0.0; commit final ainda a registrar |
| Build EAS e URL | Pendente |
| APK: nome, tamanho e SHA-256 | Pendente |
| Aparelho ou emulador / versão Android | Pendente |
| Instalação nova ou atualização | Pendente |
| Identificador Android configurado | `com.willdmx.foco` |

## Verificações automatizadas

- [x] `npm.cmd test` concluído: 36 testes aprovados, zero falhas, código de saída 0.
- [x] `npm.cmd run lint` concluído sem erros.
- [x] `npm.cmd run typecheck` concluído sobre o JavaScript.
- [x] `npm.cmd run check:android` concluído; 633 módulos, Hermes 1,7 MB, saída 0.
- [x] `npx.cmd expo-doctor` concluído; 21/21 verificações aprovadas, saída 0.
- [x] Banco novo e migração de banco v1 cobertos nos resultados reais.
- [x] Persistência após fechar/reabrir conexão coberta nos resultados reais.
- [x] Regressão do CRUD original e dos filtros coberta nos resultados reais.
- [x] Subtarefas, progresso, recorrência, transações e prevenção de duplicatas cobertos nos resultados reais.

Saídas reais: [testes.txt](evidencias/testes.txt), [lint.txt](evidencias/lint.txt), [typecheck.txt](evidencias/typecheck.txt), [bundle-android.txt](evidencias/bundle-android.txt) e [expo-doctor.txt](evidencias/expo-doctor.txt). O [registro verificacoes.json](evidencias/verificacoes.json) contém data, ambiente e códigos de saída. Os logs identificam `foco@2.0.0`; os testes executam SQL real por meio do adaptador do Node, sem substituir a execução nativa.

## Build e instalação

- [ ] Registrar a página do build concluído no EAS, com ID, estado final e perfil `preview`.
- [ ] Confirmar que o artefato baixado termina em `.apk`, e não `.aab`.
- [ ] Guardar nome, tamanho e hash SHA-256 do APK real.
- [ ] Capturar a tela de instalação do APK no Android.
- [ ] Capturar a confirmação de instalação ou abertura pelo ícone do Foco.
- [ ] Abrir o aplicativo instalado sem Expo Go ou servidor Metro.

Nomes sugeridos: `01-build-concluido.png`, `02-instalacao-apk.png` e `03-app-instalado.png`. As imagens precisam vir do EAS e do dispositivo realmente utilizados. Uma captura do Expo Go não comprova instalação do APK.

## Uso do aplicativo instalado

- [ ] Criar uma tarefa com título, descrição, categoria, prioridade e prazo.
- [ ] Tentar salvar título vazio e registrar a validação.
- [ ] Escolher repetição diária ou semanal sem prazo e registrar a validação.
- [ ] Adicionar três subtarefas, editar uma e concluir outra; conferir o percentual.
- [ ] Reabrir uma subtarefa e excluir uma; conferir atualização do checklist.
- [ ] Concluir a tarefa recorrente e conferir a próxima data.
- [ ] Conferir subtarefas copiadas como pendentes na próxima ocorrência.
- [ ] Conferir ocorrência anterior preservada no histórico.
- [ ] Reabrir e concluir a mesma ocorrência anterior sem gerar duplicata.
- [ ] Excluir a próxima ocorrência e confirmar que concluir novamente a origem não recria outra.
- [ ] Combinar filtro de recorrência e presença de subtarefas com status/categoria/prioridade.
- [ ] Conferir as ordenações por criação e prazo.
- [ ] Fechar completamente e reabrir o aplicativo; conferir tarefas, checklist e recorrência salvos.
- [ ] Excluir uma tarefa principal e conferir a remoção dos itens relacionados.
- [ ] Conferir teclado, botão voltar, texto ampliado e acesso às ações nas barras do Android.

Nomes sugeridos: `04-checklist-progresso.png`, `05-validacao-recorrencia.png`, `06-proxima-ocorrencia.png`, `07-historico.png`, `08-filtros.png` e `09-persistencia-apos-reabrir.png`. Registrar também uma pequena descrição do que cada imagem demonstra; uma captura isolada nem sempre comprova a sequência de ações.

## Migração e preservação

- [x] Registrar o teste automatizado que abre banco v1, aplica a migração e compara os dados antigos.
- [x] Registrar reaplicação da inicialização sem apagar, duplicar ou redefinir registros.
- [ ] Se houver APK anterior com mesmo pacote e assinatura, atualizar sem desinstalar e registrar os dados antes/depois.
- [ ] Se não houver APK anterior compatível, declarar essa limitação; não substituir essa evidência por uma instalação nova.

O banco do Expo Go não é importado automaticamente para o APK. Não apresentar a primeira instalação do APK como migração do armazenamento do Expo Go.

## Publicação

- [ ] Conferir os commits da Atividade 1 preservados no GitHub.
- [ ] Conferir tag `v1.0.0` na base e `v2.0.0` na entrega correspondente.
- [ ] Publicar relatório, README, roteiro e evidências sem credenciais ou dados pessoais desnecessários.
- [ ] Anexar o APK real à GitHub Release `v2.0.0`.
- [ ] Abrir o link publicado e confirmar que o arquivo pode ser baixado.

## Registro dos resultados

| Evidência coletada | Arquivo/URL real | Data/hora | Resultado observado |
| --- | --- | --- | --- |
| Testes v2 e regressão v1 | [testes.txt](evidencias/testes.txt) | 30/10/2026 | 36 aprovados, 0 falhas, saída 0 |
| Lint | [lint.txt](evidencias/lint.txt) | 30/10/2026 | Aprovado |
| Checagem de JavaScript | [typecheck.txt](evidencias/typecheck.txt) | 30/10/2026 | Aprovada |
| Bundle Android | [bundle-android.txt](evidencias/bundle-android.txt) | 30/10/2026 | 633 módulos e Hermes exportados; saída 0 |
| Diagnóstico Expo | [expo-doctor.txt](evidencias/expo-doctor.txt) | 30/10/2026 | 21/21 verificações; saída 0 |
| Instalação e uso em Android | Sem arquivo ou captura real | Pendente | Não realizado neste registro |

Quando uma verificação falhar, registrar o comportamento observado e a limitação. O checklist não deve ser marcado para indicar apenas que um recurso foi implementado no código.
