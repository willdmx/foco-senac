# Relatório — Foco v2.0 / Atividade Avaliativa 2

**Curso:** Técnico em Desenvolvimento de Sistemas — Senac  
**Modalidade:** atividade individual  
**Data da entrega:** 30/10/2026, até 23h59, horário de São Paulo  
**Repositório:** [willdmx/foco-senac](https://github.com/willdmx/foco-senac)  
**Versão de origem:** Foco v1.0, commit `27fa040`  
**Versão da evolução:** Foco v2.0.0

## Situação registrada

As duas funcionalidades da versão 2 estão implementadas. Em 30/10/2026, a suíte integrada concluiu com **36 testes aprovados, zero falhas e código de saída 0**; lint, checagem estática, bundle Android e as **21 verificações do Expo Doctor** também passaram. A geração do APK, sua publicação e o teste físico ainda aguardam confirmação neste registro. A versão 1.0 continua preservada no histórico Git.

| Item | Estado atual | Evidência |
| --- | --- | --- |
| Preservação da Atividade 1 | Commit preservado e tag publicada | `27fa040`, tag `v1.0.0` |
| Subtarefas | Implementadas; testes automatizados aprovados | [36 testes aprovados](docs/evidencias/testes.txt) |
| Recorrência | Implementada; testes automatizados aprovados | [36 testes aprovados](docs/evidencias/testes.txt) |
| Migração e regressão do CRUD | Aprovadas na suíte integrada | [Saída de `npm.cmd test`](docs/evidencias/testes.txt) |
| Lint e checagem de JavaScript | Aprovados | [Lint](docs/evidencias/lint.txt) e [checagem estática](docs/evidencias/typecheck.txt) |
| Bundle Android | Aprovado; Hermes, 633 módulos | [Bundle Android](docs/evidencias/bundle-android.txt) |
| Expo Doctor | 21/21 verificações aprovadas | [Diagnóstico Expo](docs/evidencias/expo-doctor.txt) |
| Conta e vínculo EAS | Autenticação e vínculo confirmados | `willdmx`, projeto `@willdmx/foco` |
| Build EAS / APK | Não confirmado | URL e artefato pendentes |
| Instalação e uso em Android | Não realizados neste registro | Capturas reais pendentes |
| Publicação v2 no GitHub | Pendente | Commit/tag/release finais pendentes |

## Objetivo e escopo preservado

A versão 1.0 já atendia cadastro, consulta, edição, exclusão, status, filtros, ordenação SQL, indicadores, validação e persistência. A Atividade 2 acrescenta organização por subtarefas e geração de tarefas recorrentes, mantendo a aplicação local, em português, sem autenticação, backend ou APIs externas.

Permanecem Expo SDK 57, JavaScript e a entrada blank: `index.js` registra `App.js`, que seleciona a tela por estado React e callbacks. As telas continuam em `src/screens`. Não são introduzidos Expo Router, arquivos de aplicação TypeScript ou bibliotecas de navegação.

## Funcionalidade nova 1 — Subtarefas

O checklist fica nos detalhes da tarefa principal. Cada item possui título e status, pode ser criado, editado, concluído, reaberto e excluído. O banco mantém uma relação entre o item e sua tarefa.

O progresso é calculado como `subtarefas concluídas / total de subtarefas × 100`, arredondado para apresentação. Quando não há subtarefas, o progresso é zero e a interface apresenta um estado vazio. O checklist e o status da tarefa principal são independentes: completar todos os itens não conclui silenciosamente a tarefa principal.

A exclusão da tarefa principal também exclui os itens associados. Essa regra evita subtarefas órfãs. A implementação valida títulos vazios e trata registros ausentes e falhas de escrita com mensagens compreensíveis.

## Funcionalidade nova 2 — Recorrência

O formulário permite escolher **Nenhuma**, **Diária** ou **Semanal**. Uma tarefa diária ou semanal precisa ter um prazo válido. Tarefas sem repetição continuam aceitando prazo opcional.

Ao concluir uma ocorrência recorrente:

1. A ocorrência atual é marcada como concluída e permanece no histórico.
2. A próxima ocorrência recebe os dados de conteúdo e prazo avançado em um dia ou sete dias, calculado a partir do prazo da ocorrência atual.
3. Os títulos das subtarefas são copiados para a nova ocorrência, todos como pendentes.
4. Um marcador persistente registra que aquela ocorrência já gerou a próxima.

O intervalo não é calculado a partir do momento em que a pessoa toca em concluir. Por exemplo, uma ocorrência diária com prazo em `30/10/2026` gera a próxima em `31/10/2026`; uma semanal gera em `06/11/2026`. Se uma ocorrência antiga for concluída depois do prazo, a próxima pode continuar atrasada. Isso mantém a sequência de datas do planejamento.

Chamadas repetidas não geram duplicatas. Reabrir e concluir novamente a mesma ocorrência também não cria outra próxima. Excluir a ocorrência seguinte não apaga a informação de que sua origem já gerou uma próxima. As ocorrências anteriores continuam disponíveis para consulta; as ações de edição e exclusão atuam sobre a ocorrência selecionada, sem modificar silenciosamente todo o histórico.

Essa geração acontece ao concluir a ocorrência no aplicativo. Não existe serviço em segundo plano, alarme ou notificação agendada.

## Banco, migração e responsabilidades

O banco continua sendo `foco.db`, acessado por `expo-sqlite`. As alterações são aplicadas por migrações idempotentes: abrir novamente o aplicativo não repete alterações nem apaga registros. A validação aprovada inclui banco novo e banco criado com o esquema da versão 1.0.

O esquema mantém os campos anteriores de `tarefas` e acrescenta `recorrencia` (`nenhuma`, `diaria` ou `semanal`), `origem_id` (vínculo lógico com a ocorrência anterior) e `proxima_gerada` (marcador durável, `0` ou `1`). A tabela `subtarefas` contém `id`, `tarefa_id`, `titulo`, `concluida` e `criado_em`, com chave estrangeira e `ON DELETE CASCADE`.

A migração fica em `src/database/schema.js`, verifica as colunas existentes por `PRAGMA table_info` e utiliza `ALTER TABLE` somente quando necessário. A versão do esquema é registrada em `PRAGMA user_version = 2`. Os testes confirmaram a preservação dos oito campos originais, incluindo IDs, títulos, descrições, categorias, prioridades, prazos, status e datas de criação anteriores.

As gravações passam por uma fila compartilhada e `withExclusiveTransactionAsync`. Completar uma ocorrência, registrar o marcador, criar a próxima e copiar seus itens confirmam juntos ou são desfeitos juntos. A exclusão dos itens é explícita na transação de exclusão do pai, além da chave estrangeira, para não depender somente do `PRAGMA` da conexão. A unicidade de `origem_id` complementa o marcador contra duplicações. Entradas do usuário continuam em parâmetros vinculados; somente expressões de ordenação previamente autorizadas são interpoladas no SQL.

As classes `Tarefa`, `TarefaComPrazo` e `TarefaRepository` são preservadas e estendidas. Os campos privados e getters demonstram encapsulamento; `TarefaComPrazo` mantém herança e sobrescrita de métodos. `Subtarefa` valida os itens, e `RecorrenciaService` concentra o cálculo e a validação da repetição. A interface continua chamando o repositório, sem inserir SQL nas telas.

## Interface e consultas

O formulário integra repetição e a exigência de prazo. Os detalhes concentram checklist, progresso e ações da ocorrência. A lista exibe os sinais dos novos recursos e oferece filtros de recorrência e presença de subtarefas, combináveis com status, categoria, prioridade e as quatro ordenações existentes.

As consultas utilizam dados reais do SQLite. O filtro de recorrência aceita `todas`, `recorrentes` e `nao_recorrentes`; o de subtarefas aceita `todas`, `com` e `sem`, usando `EXISTS`/`NOT EXISTS`. Os totais de subtarefas são agregados no SQL. Estados de carregamento, lista vazia, falha e confirmação continuam explícitos. A revisão da interface contempla textos em português, hierarquia visual, áreas de toque, mensagens acessíveis e bloqueio de toques repetidos enquanto uma gravação está em andamento.

## Testes e resultados

Os resultados abaixo correspondem à execução da versão 2 em 30/10/2026. Os 16 testes anteriores foram executados novamente, junto com 20 novos testes; a aprovação não se baseia apenas no histórico da Atividade 1.

| Verificação | Comando | Resultado v2 | Evidência |
| --- | --- | --- | --- |
| Testes automatizados | `npm.cmd test` | **36 aprovados, 0 falhas; saída 0** | [testes.txt](docs/evidencias/testes.txt) |
| Lint | `npm.cmd run lint` | Aprovado; saída 0 | [lint.txt](docs/evidencias/lint.txt) |
| Checagem de JavaScript | `npm.cmd run typecheck` | Aprovada; saída 0 | [typecheck.txt](docs/evidencias/typecheck.txt) |
| Bundle Android | `npm.cmd run check:android` | Aprovado; saída 0 | [bundle-android.txt](docs/evidencias/bundle-android.txt) |
| Diagnóstico Expo | `npx.cmd expo-doctor` | 21/21 aprovadas; saída 0 | [expo-doctor.txt](docs/evidencias/expo-doctor.txt) |

As evidências vinculadas são saídas reais dos comandos. O [registro de execução](docs/evidencias/verificacoes.json) informa `2026-10-30T19:31:36-03:00`, Node `24.16.0`, npm `11.13.0` e os códigos de saída. O bundle exportou `index.js` com 633 módulos e bytecode Hermes de 1,7 MB para `dist/android`. Esse empacotamento não produz APK nem comprova execução física.

A suíte aprovada cobre CRUD original e filtros; validações; criar, editar, concluir, reabrir e excluir subtarefas; progresso vazio, parcial e completo; recorrência diária/semanal; viradas de mês e ano; exigência de prazo; cópia de itens pendentes; histórico; chamadas repetidas; reabertura da origem; exclusão da próxima; atomicidade em falha; abertura nova; migração v1 e reabertura sem perda ou duplicação.

Os cenários incluem 12 solicitações concorrentes, repositórios distintos e duas conexões de arquivo; rollback de falhas na migração, cópia de subtarefas e exclusão; chave estrangeira ativada e desativada; e limite do calendário até o ano 9999. Depois de apagar a próxima ocorrência e reabrir o banco, concluir novamente a origem não gera duplicação.

Os testes de repositório utilizam o SQLite do Node com o adaptador `tests/sqlite-helper.js` para executar o SQL real. Os cenários novos estão em `tests/migrations.test.js`, `tests/v2-models.test.js` e `tests/v2-repository.test.js`. Esse adaptador existe somente nos testes e não substitui o teste do módulo nativo `expo-sqlite` no Android. O comando `typecheck` verifica arquivos `.js` e JSDoc sem emitir código ou migrar a aplicação para TypeScript.

## APK com EAS Build

O perfil `preview` foi configurado com `distribution: "internal"`, `android.buildType: "apk"` e `developmentClient: false`. O versionamento utiliza `appVersionSource: "local"`. A conta `willdmx` está autenticada, o projeto foi vinculado e a credencial de assinatura foi gerada remotamente, sem chave armazenada no repositório. O build ainda não foi confirmado.

```powershell
npx.cmd eas-cli@latest whoami
# Executar login apenas se necessário:
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build -p android --profile preview
```

| Identificação do artefato | Valor confirmado |
| --- | --- |
| Identificador Android (`android.package`) | `com.willdmx.foco` |
| Versão / versionCode | `2.0.0` / `2` |
| Conta/projeto Expo | `willdmx` / [@willdmx/foco](https://expo.dev/accounts/willdmx/projects/foco) |
| ID do projeto EAS | `39730c55-6ea4-49e8-aa07-9d519eff7170` |
| ID do build | Pendente |
| URL do build | Pendente — nenhum link de build anunciado |
| Estado final do build | Pendente |
| URL do `.apk` | Pendente — nenhum APK confirmado |
| Nome/tamanho/SHA-256 do arquivo | Pendente após download real |
| Commit associado ao build | Pendente |

Só um build concluído com artefato `.apk` atende ao requisito de arquivo instalável. Um `.aab`, um bundle JavaScript, a abertura no Expo Go ou uma captura da fila do EAS não comprovam essa entrega. Caso haja falha, devem ser registrados o erro, a correção e o novo resultado sem ocultar a limitação.

## Instalação e validação no Android

Depois de obter o APK real:

1. Abrir o link do arquivo no celular e concluir o download.
2. Permitir a instalação por essa origem quando o Android solicitar e instalar o arquivo.
3. Abrir Foco pelo ícone, sem precisar iniciar Expo Go ou Metro.
4. Cadastrar uma tarefa recorrente com prazo e três subtarefas; editar, concluir, reabrir e excluir itens.
5. Concluir a ocorrência e conferir a nova data, checklist pendente e ocorrência anterior no histórico.
6. Reabrir e concluir a anterior para confirmar que não surge uma terceira cópia dessa origem.
7. Filtrar a lista e conferir os indicadores e ordenações.
8. Fechar completamente e reabrir o aplicativo; conferir os registros.
9. Registrar somente capturas obtidas durante esses passos, conforme [checklist](docs/EVIDENCIAS_ATIVIDADE2.md).

**Armazenamento:** Expo Go e o APK possuem áreas de dados separadas. A primeira instalação do APK não importa automaticamente as tarefas criadas no Expo Go. Atualizar o mesmo aplicativo com o mesmo identificador e assinatura preserva seu banco e permite aplicar a migração. Não é necessário desinstalar o aplicativo para migrar; desinstalar ou limpar dados remove o armazenamento.

## Publicação e apresentação

A publicação mantém os commits da Atividade 1, sem recriar o repositório ou usar force push. A base é `27fa040`, já identificada pela tag publicada `v1.0.0`. A tag `v2.0.0` deve apontar para a entrega final após conferir o commit e os artefatos correspondentes.

Na [página de releases](https://github.com/willdmx/foco-senac/releases), criar a entrega `Foco v2.0.0`, associada à tag correta, e anexar o APK efetivamente gerado. As notas devem incluir subtarefas, recorrência, resultado dos testes, link do build, checksum do APK e limitações reais. A publicação do código sem o artefato não deve ser anunciada como entrega completa do APK.

O [roteiro individual](docs/ROTEIRO_APRESENTACAO.md) foi dimensionado para 3 a 5 minutos. O professor deve receber o link do repositório, da release, do APK e deste relatório quando esses itens estiverem disponíveis.

## Limitações conhecidas

- Build, instalação e execução física ainda não estão comprovados na redação inicial deste relatório. Não foram encontrados ADB, Android SDK ou emulador nos caminhos locais verificados; por isso não há evidência de execução Android neste ambiente.
- Não há sincronização entre aparelhos, backup automático, importação do banco do Expo Go ou notificações.
- A recorrência avança ao concluir uma ocorrência; não gera todas as tarefas futuras antecipadamente.
- A versão web não é alvo validado desta entrega.
- A Atividade 1 registrou alertas de dependências transitivas; atualizar o SDK ou aplicar correções forçadas permanece fora do escopo sem impedimento técnico confirmado.

## Referências técnicas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [expo-sqlite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Gerar APK Android com EAS](https://docs.expo.dev/build-reference/apk/)
- [Distribuição interna no EAS](https://docs.expo.dev/build/internal-distribution/)
