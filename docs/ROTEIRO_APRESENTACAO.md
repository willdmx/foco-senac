# Apresentação individual — Foco v2.0

**Duração estimada:** 4 minutos e 30 segundos.  
**Público:** avaliação da Atividade 2 do curso Técnico em Desenvolvimento de Sistemas — Senac.

Antes de apresentar, separar o aparelho com o APK real instalado, o repositório aberto, o relatório e os resultados de testes. Preparar uma tarefa de demonstração com prazo atual e repetição diária e manter outra tarefa sem repetição para comparação. Esses registros devem ser criados manualmente no aplicativo, não inseridos automaticamente no banco.

Se o APK ou o teste físico ainda estiver pendente, declarar isso no início. Não usar este roteiro para afirmar que um build ou uma instalação aconteceu sem evidência.

## 0:00–0:30 — Problema e evolução

**Fala sugerida:** “O Foco organiza tarefas pessoais e acadêmicas no próprio celular. Na primeira atividade, implementei CRUD, filtros e persistência SQLite. Nesta segunda etapa, acrescentei subtarefas e recorrência, mantendo o projeto em JavaScript com Expo SDK 57.”

**Mostrar:** lista de tarefas e indicadores. Identificar que a navegação continua controlada pelo estado de `App.js`, com telas em `src/screens`.

## 0:30–1:20 — Subtarefas e progresso

**Ação:** abrir a tarefa “Estudar banco de dados”, adicionar “Revisar SQL”, “Resolver exercícios” e “Revisar respostas”. Editar um título, concluir um item e mostrar o percentual. Reabrir o item e mostrar a mudança.

**Fala sugerida:** “Cada subtarefa é um registro relacionado à tarefa principal. O progresso usa a quantidade concluída sobre o total. O status da tarefa principal continua independente, e excluir a tarefa também remove seus itens.”

## 1:20–2:20 — Recorrência, histórico e validação

**Ação:** mostrar a opção Diária e o prazo da tarefa. Concluir a ocorrência, abrir a próxima e conferir o prazo avançado em um dia e o checklist novamente pendente. Mostrar a ocorrência anterior concluída. Se houver tempo, reabri-la e concluí-la novamente para mostrar que não aparece outra cópia da mesma origem.

**Fala sugerida:** “A recorrência exige uma data válida. Ao concluir, o repositório gera a próxima ocorrência dentro de uma transação. O avanço usa o prazo original: um dia para diária e sete para semanal. Um registro persistente impede duplicações e mantém o histórico.”

**Validação rápida:** apontar a mensagem que aparece ao tentar salvar uma tarefa recorrente sem prazo. Se o tempo estiver curto, mostrar uma captura real dessa validação identificada no relatório.

## 2:20–3:00 — Consultas e persistência

**Ação:** aplicar os filtros de recorrência e subtarefas, combinando com status. Trocar uma ordenação. Fechar e reabrir o aplicativo para conferir os dados, se isso puder ser feito dentro do tempo disponível.

**Fala sugerida:** “Os filtros são consultas SQL reais. Os valores usam parâmetros vinculados e a ordenação vem de uma lista autorizada. As migrações evoluem o banco antigo sem apagar tarefas. Expo Go e APK têm armazenamentos separados; não há transferência automática entre eles.”

## 3:00–3:45 — Arquitetura, POO e testes

**Mostrar:** `Tarefa`, `TarefaComPrazo`, repositório e implementação da regra de recorrência. Em seguida, abrir o log dos testes da versão entregue.

**Fala sugerida:** “Os modelos encapsulam os dados e validam entradas. `TarefaComPrazo` herda de `Tarefa` e sobrescreve métodos de prazo, demonstrando polimorfismo. O repositório concentra acesso ao banco e transações. Os testes incluem CRUD anterior, subtarefas, migração e prevenção de duplicações.”

Informar a quantidade de testes e resultados somente conforme os logs reais. Explicar que os testes de SQLite no computador e o bundle não substituem a execução do driver nativo no aparelho.

## 3:45–4:30 — APK, evidências e entrega

**Mostrar:** página do build EAS concluído, arquivo `.apk`, captura real da instalação e GitHub Release, quando disponíveis.

**Fala sugerida, somente se comprovada:** “O perfil preview gera um APK instalável sem Expo Go. Esta é a página do build e esta é a evidência da instalação. O código preserva o histórico da primeira atividade; a versão 2 está identificada no GitHub com relatório, testes e APK.”

Concluir citando as limitações reais: armazenamento local, ausência de sincronização e notificações, e geração da próxima ocorrência apenas ao concluir a atual. Caso qualquer etapa de entrega esteja pendente, explicar o estado e o próximo passo de forma direta.

## Conferência antes da fala

- [ ] APK real instalado e aberto, ou limitação informada ao professor.
- [ ] Tarefa de demonstração e checklist preparados manualmente.
- [ ] Prazo e repetição da demonstração conferidos.
- [ ] Resultados dos testes correspondem ao commit apresentado.
- [ ] Capturas e links abrem e correspondem ao build entregue.
- [ ] Relatório e release estão acessíveis.
- [ ] Ensaio concluído entre 3 e 5 minutos.
