# Foco v1.0

Aplicativo Android para organizar tarefas pessoais e acadêmicas, desenvolvido para a atividade individual do curso **Técnico em Desenvolvimento de Sistemas do Senac**. O projeto utiliza JavaScript, React Native, Expo SDK 57 e SQLite local.

## Funcionalidades

- Cadastrar, consultar, editar e excluir tarefas.
- Informar título obrigatório, descrição opcional, categoria, prioridade e prazo opcional.
- Alternar entre tarefas pendentes e concluídas.
- Combinar filtros de status, categoria e prioridade.
- Ordenar por criação, da mais recente ou mais antiga, e por prazo, do mais próximo ou mais distante.
- Acompanhar indicadores de tarefas totais, pendentes e concluídas.
- Validar campos e datas, confirmar exclusões e apresentar mensagens compreensíveis.
- Armazenar tarefas no dispositivo, preservando os dados ao fechar e reabrir o aplicativo.

Não há cadastro de usuário, autenticação, backend, sincronização, dados demonstrativos inseridos automaticamente ou chamadas a APIs externas. O uso das tarefas é local. No desenvolvimento com Expo Go, o computador continua sendo necessário para servir o pacote JavaScript ao abrir ou recarregar o projeto; isso não significa que as tarefas dependam de um servidor.

## Instalação e execução

### Requisitos

- Node.js e npm. **Node 24** é recomendado para executar também os testes com `node:sqlite`.
- Um Android com uma versão do **Expo Go compatível com o SDK 57**.
- Computador e celular na mesma rede para acessar o servidor de desenvolvimento.

O projeto já está inicializado. Não execute `create-expo-app` novamente e não atualize o SDK para iniciar a aplicação.

No PowerShell, dentro da pasta do projeto:

```powershell
npm.cmd ci
npx.cmd expo start --go
```

`npm.cmd ci` instala as versões registradas no `package-lock.json`. Os sufixos `.cmd` evitam o bloqueio de scripts `.ps1` do PowerShell.

1. Mantenha o terminal com o Expo aberto.
2. Abra o Expo Go no Android e leia o QR Code exibido pelo terminal.
3. Aguarde o carregamento do projeto.
4. Cadastre a primeira tarefa. Uma instalação nova começa sem tarefas.

Se houver uma versão antiga do pacote JavaScript em cache:

```powershell
npx.cmd expo start --go --clear
```

Se o celular não conseguir alcançar o computador, confira a rede e a permissão do Node.js no firewall. Um túnel pode ser usado como alternativa com `npx.cmd expo start --go --tunnel`; o Expo poderá solicitar uma ferramenta adicional de túnel. Isso não altera o armazenamento local do aplicativo.

O alvo deste MVP é **Android no Expo Go**. O script `web` herdado do template não representa suporte validado à versão web do SQLite. Não é necessário gerar pastas `android/` ou `ios/`, usar Android Studio ou fazer um build nativo para executar os módulos utilizados aqui.

## Estrutura e navegação

```text
foco/
├── index.js                         # Registra o componente raiz do Expo
├── App.js                           # Entrada visual e navegação por estado React
├── app.json                         # Configuração do aplicativo e plugin SQLite
├── src/
│   ├── screens/
│   │   ├── TaskListScreen.js         # Lista, filtros, ordenação e indicadores
│   │   ├── TaskFormScreen.js         # Cadastro e edição
│   │   └── TaskDetailScreen.js       # Consulta, status e exclusão
│   ├── components/
│   │   ├── ui.js                     # Botões, seletores, mensagens e estrutura visual
│   │   ├── TaskCard.js               # Item da lista com consulta e conclusão
│   │   └── FeedbackProvider.js       # Mensagens compartilhadas de sucesso
│   ├── models/
│   │   ├── Tarefa.js
│   │   ├── TarefaComPrazo.js
│   │   └── index.js                  # Fábrica de modelos
│   ├── database/
│   │   ├── index.js                  # Abre e compartilha a conexão foco.db
│   │   └── schema.js                 # Tabela e índices não destrutivos
│   ├── repositories/
│   │   ├── TarefaRepository.js       # CRUD, filtros, ordenações e indicadores SQL
│   │   └── index.js                  # Instância compartilhada do repositório
│   └── utils/
│       ├── constants.js              # Categorias, prioridades, filtros e limites
│       ├── dates.js                  # Conversão e validação de datas
│       ├── errors.js                 # Erros de validação e persistência
│       └── theme.js                  # Cores e estilos comuns
├── tests/
│   ├── models.test.js
│   └── repository.test.js
├── eslint.config.js
└── jsconfig.json                     # Checagem estática dos arquivos JavaScript
```

O `package.json` aponta para `index.js`, que registra `App.js`, preservando a entrada do template blank. O estado de `App.js` determina a tela visível; as telas recebem dados e callbacks para voltar, abrir detalhes e salvar. Não há `src/app`, Expo Router ou biblioteca de navegação.

O fluxo de dados é: **tela → repositório → modelo validado → SQLite**. Ao consultar, o repositório transforma as linhas do banco em instâncias dos modelos. A interface não contém comandos SQL.

## Programação orientada a objetos

### Encapsulamento e validação

`Tarefa` mantém os dados em campos privados, como `#titulo` e `#categoria`, e os expõe por getters. Os dados só são aceitos após a validação do construtor; uma edição cria uma nova instância validada antes de gravar no banco. `toJSON()` produz um objeto com os valores públicos.

Regras principais:

- Título: obrigatório, sem espaços em branco isolados, até 120 caracteres.
- Descrição: opcional, até 2.000 caracteres.
- Categorias: Pessoal, Acadêmica, Trabalho e Outros.
- Prioridades: Baixa, Média e Alta, gravadas como `baixa`, `media` e `alta`.
- Prazo: opcional; a interface utiliza `DD/MM/AAAA`, e datas inexistentes são rejeitadas, inclusive em anos bissextos.
- Prazos anteriores ao dia atual são permitidos e identificados como atrasados enquanto a tarefa estiver pendente.

### Herança e polimorfismo

`TarefaComPrazo extends Tarefa` reaproveita as regras da classe base e adiciona `#prazo`. Ela sobrescreve `getResumoPrazo()` e `estaVencida()`.

```javascript
import { criarModeloTarefa } from './src/models/index.js';

const semPrazo = criarModeloTarefa({ titulo: 'Organizar materiais' });
const comPrazo = criarModeloTarefa({
  titulo: 'Entregar atividade',
  categoria: 'Acadêmica',
  prioridade: 'alta',
  prazo: '2026-11-30',
});

// A mesma chamada tem comportamentos diferentes conforme a classe da instância.
semPrazo.getResumoPrazo(); // Sem prazo
comPrazo.getResumoPrazo(); // Até a data, vence hoje ou em atraso, conforme o dia atual
```

A fábrica `criarModeloTarefa()` escolhe a classe adequada. A apresentação do prazo consulta o mesmo método, sem duplicar a regra de negócio nas telas.

### Responsabilidade do repositório

`TarefaRepository` concentra os métodos `criar`, `buscarPorId`, `listar`, `atualizar`, `excluir`, `definirConclusao` e `obterIndicadores`. A conexão é recebida pelo construtor, o que permite testar o SQL separadamente da interface e do módulo nativo. Erros do banco são tratados com `try/catch` e convertidos em mensagens adequadas ao usuário.

Editar o conteúdo de uma tarefa preserva sua data original de criação e seu status. Alterar o status é uma operação específica.

## SQLite e persistência

O banco local chama-se **`foco.db`**. A aplicação usa exclusivamente `expo-sqlite`, com as APIs assíncronas `openDatabaseAsync`, `execAsync`, `runAsync` e `getAllAsync`.

| Campo | Tipo SQLite | Finalidade |
| --- | --- | --- |
| `id` | INTEGER | Chave primária autoincrementada |
| `titulo` | TEXT | Título obrigatório |
| `descricao` | TEXT | Descrição; texto vazio quando não preenchida |
| `categoria` | TEXT | Categoria autorizada |
| `prioridade` | TEXT | `baixa`, `media` ou `alta` |
| `prazo` | TEXT ou NULL | Dia de calendário em `AAAA-MM-DD` |
| `concluida` | INTEGER | `0` para pendente e `1` para concluída |
| `criado_em` | TEXT | Data e hora de criação em ISO 8601 |

A inicialização executa `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`. Não executa `DROP TABLE`, limpeza ou inserção de tarefas fictícias. Os índices apoiam consultas por status, categoria/prioridade, prazo e criação. O modo WAL é habilitado. A conexão e a inicialização são compartilhadas; uma falha de abertura permite uma nova tentativa.

O prazo é um dia de calendário, sem conversão para UTC, evitando mudar o dia informado por causa do fuso horário. Já `criado_em` registra um instante, apresentado em horário local na interface.

Os registros permanecem após fechar o aplicativo, recarregar o JavaScript ou reiniciar o servidor Expo. Limpar os dados do Expo Go, desinstalá-lo ou apagar seu armazenamento pode remover o banco; este MVP não oferece backup ou sincronização.

### Consultas SQL

Valores informados pelo usuário são enviados separadamente em parâmetros vinculados `?`. `execAsync` é reservado ao SQL estático de inicialização.

```sql
-- Cadastro: os valores são enviados em um array para runAsync.
INSERT INTO tarefas
  (titulo, descricao, categoria, prioridade, prazo, concluida, criado_em)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Consulta individual.
SELECT id, titulo, descricao, categoria, prioridade, prazo, concluida, criado_em
FROM tarefas WHERE id = ? LIMIT 1;

-- Exemplo de filtros combinados e prazo mais próximo.
SELECT id, titulo, descricao, categoria, prioridade, prazo, concluida, criado_em
FROM tarefas
WHERE concluida = ? AND categoria = ? AND prioridade = ?
ORDER BY prazo IS NULL ASC, prazo ASC, criado_em DESC, id DESC;

-- Edição do conteúdo, preservando status e criação.
UPDATE tarefas
SET titulo = ?, descricao = ?, categoria = ?, prioridade = ?, prazo = ?
WHERE id = ?;

-- Alteração de status e exclusão.
UPDATE tarefas SET concluida = ? WHERE id = ?;
DELETE FROM tarefas WHERE id = ?;

-- Indicadores de todas as tarefas, independentemente do filtro da lista.
SELECT COUNT(*) AS total,
  COALESCE(SUM(CASE WHEN concluida = 0 THEN 1 ELSE 0 END), 0) AS pendentes,
  COALESCE(SUM(CASE WHEN concluida = 1 THEN 1 ELSE 0 END), 0) AS concluidas
FROM tarefas;
```

Nomes de colunas e direções de ordenação não são recebidos diretamente do formulário. O repositório aceita somente as chaves `recentes`, `antigas`, `prazo_proximo` e `prazo_distante`, traduzidas por uma lista fechada de expressões SQL. Entradas fora dessa lista são rejeitadas. Tarefas sem prazo ficam no fim das duas ordenações por prazo; `id` desempata resultados para manter a ordem previsível.

## Verificações

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run check:android
```

- `lint`: analisa os arquivos com ESLint e a configuração do Expo.
- `typecheck`: usa `tsc` como verificador de **JavaScript**, com `allowJs`, `checkJs` e JSDoc definidos no `jsconfig.json`. Não existem arquivos de aplicação TypeScript, migração de linguagem ou emissão de código por esse comando.
- `test`: executa testes de modelos e repositório com o test runner do Node. O adaptador `node:sqlite` existe somente nos testes; no aplicativo, a persistência continua exclusivamente em `expo-sqlite`.
- `check:android`: empacota a aplicação para Android em `dist/android`. Isso detecta erros de importação e transformação, mas não produz um APK e não substitui a execução em um dispositivo.

Os **16 testes automatizados da camada de dados passaram**, incluindo CRUD, filtros combinados, quatro ordenações, parâmetros vinculados, tentativas de injeção, datas inválidas, encapsulamento, herança, tratamento de erros e preservação de registros em um arquivo SQLite após fechar/reabrir a conexão.

Na implementação de 28/10/2026, passaram também **ESLint**, **checagem estática do JavaScript**, **exportação Android com bytecode Hermes** e **as 21 verificações do Expo Doctor** (`npx.cmd --yes expo-doctor`). O compilador Hermes precisou executar fora do sandbox porque a primeira tentativa teve a gravação de um arquivo temporário bloqueada. A checagem `expo install --check` confirmou as versões usando o mapa local do SDK 57. O Expo permaneceu em `57.0.31`, React Native em `0.86.3` e expo-sqlite em `57.0.4`.

`npm audit` reportou oito alertas na cadeia de dependências do Expo (cinco baixos e três altos), associados a `deepmerge` e `zod`. Não foi aplicado `audit fix --force`: a correção sugerida pelo npm mudaria o SDK, contrariando o escopo desta atividade. Isso deve ser reavaliado antes de uma publicação em produção.

**Não foi realizado teste em Android físico ou emulador.** A confirmação do comportamento do driver nativo, teclado, botão voltar e áreas das barras do sistema deve ser feita no Expo Go pelo roteiro abaixo.

## Roteiro de apresentação individual

1. **Apresentar o problema:** explicar que o Foco reúne tarefas pessoais e acadêmicas em um aplicativo local, simples e sem login.
2. **Mostrar a arquitetura:** abrir `App.js` e as pastas `screens`, `models`, `database` e `repositories`; explicar a navegação por estado e a separação de responsabilidades.
3. **Demonstrar cadastro e validação:** tentar salvar um título vazio; depois cadastrar “Entregar atividade de banco de dados”, categoria Acadêmica, prioridade Alta e um prazo válido. Tentar uma data impossível, como `31/02/2026`, para demonstrar a mensagem de validação.
4. **Adicionar variedade:** criar uma tarefa Pessoal sem prazo e outra com prioridade diferente. Mostrar a lista e os indicadores.
5. **Consultar e editar:** abrir os detalhes da tarefa acadêmica, acrescentar a descrição e alterar o prazo. Voltar à lista e conferir o conteúdo atualizado.
6. **Demonstrar status:** marcar uma tarefa como concluída, conferir os indicadores e torná-la pendente novamente.
7. **Demonstrar SQL na prática:** combinar status, categoria e prioridade, alternar as quatro ordenações e mostrar `listar()` no repositório. Explicar parâmetros vinculados e a lista autorizada de ordenações.
8. **Demonstrar POO:** mostrar os campos privados e getters de `Tarefa`, o `extends` de `TarefaComPrazo` e a sobrescrita de `getResumoPrazo()`.
9. **Demonstrar persistência:** fechar o Expo Go pela lista de aplicativos recentes e reabrir o mesmo projeto, mantendo o servidor Expo disponível. Conferir que títulos, descrições, prazos e status continuam salvos. Não limpar dados nem desinstalar o Expo Go durante essa demonstração.
10. **Demonstrar exclusão:** abrir uma tarefa, solicitar a exclusão, cancelar uma vez e depois confirmar. Conferir a lista e os indicadores.
11. **Apresentar evidências:** executar os testes e explicar o que eles verificam. Diferenciar os testes de SQL no computador da execução nativa no Android.

## Checklist manual no Android

- [ ] Abrir o projeto com Expo Go compatível com o SDK 57.
- [ ] Cadastrar tarefas com e sem prazo e conferir os campos obrigatórios.
- [ ] Rejeitar título vazio, data incompleta e data inexistente.
- [ ] Consultar detalhes e editar todos os campos permitidos.
- [ ] Concluir e reabrir uma tarefa sem alterar sua data de criação.
- [ ] Combinar os três filtros e retornar à lista completa.
- [ ] Conferir as quatro ordenações, incluindo tarefas sem prazo.
- [ ] Conferir os indicadores após cadastrar, concluir, reabrir e excluir.
- [ ] Cancelar e confirmar uma exclusão.
- [ ] Fechar/reabrir o projeto e verificar a persistência.
- [ ] Conferir formulário com teclado aberto, texto ampliado e botão voltar do Android.

## Referências

- [Documentação do Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [expo-sqlite no SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Documentação do React Native 0.86](https://reactnative.dev/docs/0.86/getting-started)
