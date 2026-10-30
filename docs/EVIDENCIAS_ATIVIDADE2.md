# Evidências reais — Atividade 2 / Foco v2.0

Este documento registra evidências e pendências. Itens marcados correspondem a execuções reais e têm referências abaixo. **Instalação e uso físico continuam desmarcados**, pois ainda não há essas evidências. Capturas ilustrativas, interfaces geradas, logs inventados e resultados da versão 1.0 não comprovam a versão 2.

## Identificação da execução

| Dado | Registro |
| --- | --- |
| Data/hora da coleta automatizada | 30/10/2026, 19h31min36s, horário de São Paulo (`-03:00`) |
| Execução das verificações automatizadas | Assistente no workspace Windows, via PowerShell |
| Responsável pela instalação/teste físico | Não realizado; responsável ainda não registrado |
| Commit do código verificado e enviado ao EAS | [`7d9a4f31a845fe98ab21169d4f66b4a3ab5dcc7a`](https://github.com/willdmx/foco-senac/commit/7d9a4f31a845fe98ab21169d4f66b4a3ab5dcc7a) |
| Build EAS e URL | [`0aa6a645-5676-4895-a78c-b726e9e0e544`](https://expo.dev/accounts/willdmx/projects/foco/builds/0aa6a645-5676-4895-a78c-b726e9e0e544), **`FINISHED`** às 19h38min21s de 30/10/2026 (São Paulo) |
| APK: nome e tamanho | `foco-v2.0.0.apk`, `75856729` bytes |
| SHA-256 | `9ec14e6f08c983f6da43e0581d61d9375c54cdb85224b8d3269366d5a3f09a78` |
| Registro do download e da estrutura | [apk.json](evidencias/apk.json), 30/10/2026 às 19h39min20s (São Paulo) |
| Aparelho ou emulador / versão Android | Não executado; dispositivo não disponível |
| Instalação nova ou atualização | Nenhuma instalação executada neste registro |
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

- [x] Registrar a página do build concluído no EAS, com ID, estado final e perfil `preview`.
- [x] Confirmar que o artefato baixado termina em `.apk`, e não `.aab`.
- [x] Guardar nome, tamanho e hash SHA-256 do APK real.
- [x] Verificar estrutura do APK: manifest, classes DEX, bundle e bibliotecas SQLite para quatro ABIs.
- [ ] Capturar a tela de instalação do APK no Android.
- [ ] Capturar a confirmação de instalação ou abertura pelo ícone do Foco.
- [ ] Abrir o aplicativo instalado sem Expo Go ou servidor Metro.

O build e o arquivo estão registrados na [página EAS](https://expo.dev/accounts/willdmx/projects/foco/builds/0aa6a645-5676-4895-a78c-b726e9e0e544) e em [apk.json](evidencias/apk.json); o [APK está disponível no EAS](https://expo.dev/artifacts/eas/LNOr7pgwpGNROJRNtqAetYmdg_Us4XRSfPT8X5FA7DM.apk). Não foram fabricadas capturas.

Nomes sugeridos para capturas futuras: `01-build-concluido.png`, `02-instalacao-apk.png` e `03-app-instalado.png`. As imagens precisam vir do EAS e do dispositivo realmente utilizados. Uma captura do Expo Go ou a inspeção do arquivo ZIP não comprova instalação do APK.

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
- [x] Declarar a limitação: não houve APK v1 compatível testado por atualização; essa evidência não foi substituída por instalação nova.

O banco do Expo Go não é importado automaticamente para o APK. Não apresentar a primeira instalação do APK como migração do armazenamento do Expo Go. Os testes aprovados de migração são automatizados sobre banco SQLite real, sem evidência de atualização de um APK v1 em aparelho.

## Publicação

- [x] Conferir os commits da Atividade 1 preservados no GitHub, com a tag `v1.0.0` em `27fa040`.
- [x] Publicar código-fonte, testes e documentação v2 em `main`, no commit `7d9a4f3`, confirmado no remoto.
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
| Publicação do código v2 | [Commit `7d9a4f3`](https://github.com/willdmx/foco-senac/commit/7d9a4f31a845fe98ab21169d4f66b4a3ab5dcc7a) | 30/10/2026 | Publicado em `main` |
| Build EAS concluído | [Build `0aa6a645`](https://expo.dev/accounts/willdmx/projects/foco/builds/0aa6a645-5676-4895-a78c-b726e9e0e544) | 30/10/2026, 19h38min21s (São Paulo) | `FINISHED`, APK gerado |
| Download e verificação do APK | [apk.json](evidencias/apk.json) | 30/10/2026, 19h39min20s (São Paulo) | 75.856.729 bytes; SHA-256 e estrutura registrados |
| Instalação e uso em Android | Sem arquivo ou captura real | Pendente | Não realizado neste registro |

Quando uma verificação falhar, registrar o comportamento observado e a limitação. O checklist não deve ser marcado para indicar apenas que um recurso foi implementado no código.
