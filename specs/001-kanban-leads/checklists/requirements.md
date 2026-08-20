# Specification Quality Checklist: Kanban de Leads

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Decisões de escopo resolvidas pelo dono em 20/08/2026:
  - **FR-018**: o quadro **substitui** a tabela em `/leads`. Sem alternador de
    visão, sem rota separada, e o filtro por etapa sai da barra.
  - **FR-019**: reordenação manual dentro da coluna **entra no escopo**, com a
    ordem persistida e compartilhada por toda a equipe (User Story 4, P3).
- Consequências registradas na spec: FR-016 reescrito (prioridade manual vence,
  tempo parado é só o padrão), FR-020 a FR-022 acrescentados, dois edge cases de
  concorrência/entrada de lead novo, entidade "Posição de prioridade", SC-008 e
  SC-009.
- Ponto de atenção para `/speckit-plan`: a posição de prioridade é o único dado
  novo que a feature exige guardar. Vale confirmar se o custo dela se justifica
  antes de escrever código, já que P1 e P2 entregam sem ela.
