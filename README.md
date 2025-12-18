# Spot - Sistema de Agendamento de Salas

Sistema web para agendamento de salas de reunião da Ponto Forte, focado na visualização intuitiva de disponibilidade (Timeline) e controle de acesso granulado gerenciado pelo RH.

## 🚀 Tecnologias

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS + Shadcn/ui
- **Backend:** Supabase (Auth, Database, Realtime, Storage, Edge Functions)
- **Ícones:** Lucide React
- **Notificações:** Sonner
- **Gráficos:** Recharts
- **PWA:** Vite Plugin PWA

## 📋 Pré-requisitos

- Node.js 18+ e pnpm
- Conta no Supabase
- (Opcional) Conta no Resend para envio de emails

## 🛠️ Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd spot
```

2. Instale as dependências:

```bash
pnpm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_RESEND_API_KEY=sua_chave_do_resend (opcional)
```

4. Execute o schema SQL no Supabase:

   - Acesse o SQL Editor no Supabase Dashboard
   - **Se você já executou o schema inicial:** Execute `src/data/migration.sql` para atualizar
   - **Se é a primeira vez:** Execute `src/data/schema.sql` completo
   - **IMPORTANTE:** Após executar migration.sql ou schema.sql, execute `src/data/fix-bookings-policy.sql` para atribuir permissões aos usuários
   - Execute o conteúdo de `src/data/seed.sql` para dados iniciais

5. Configure o Storage:

   **Bucket de Imagens de Salas:**
   - No Supabase Dashboard, vá em Storage
   - Crie um bucket público chamado `room-images`
   - **Configurações recomendadas:**
     - **Visibilidade:** Público (para exibir imagens nas páginas)
     - **Tamanho máximo:** 5MB (validado no frontend)
     - **Tipos MIME permitidos:** `image/jpeg`, `image/png`, `image/webp` (validado no frontend)

   **Bucket de Avatares de Usuários:**
   - No Supabase Dashboard, vá em Storage
   - Crie um bucket público chamado `avatars`
   - **Configurações recomendadas:**
     - **Visibilidade:** Público (para exibir avatares)
     - **Tamanho máximo:** 2MB (validado no frontend)
     - **Tipos MIME permitidos:** `image/jpeg`, `image/png`, `image/webp` (validado no frontend)
   
   **Criar buckets via SQL (alternativa):**
   Execute no SQL Editor:
   ```sql
   insert into storage.buckets (id, name, public)
   values ('avatars', 'avatars', true)
   on conflict (id) do nothing;
   ```

   **Configurar Políticas RLS:**
   - Execute o arquivo `src/data/storage-policies.sql` no SQL Editor para configurar as políticas RLS:
     - **room-images**: Leitura pública, Upload/Update/Delete apenas para administradores
     - **avatars**: Leitura pública, Upload/Update/Delete apenas para o próprio usuário

6. Configure as Edge Functions:

   - Instale o Supabase CLI: `npm install -g supabase`
   - Faça login: `supabase login`
   - Link seu projeto: `supabase link --project-ref seu-project-ref`
   - Deploy das funções: `supabase functions deploy create-user`
   - Deploy da função de email: `supabase functions deploy send-booking-email`

7. Crie o primeiro usuário admin:

   - No Supabase Dashboard, vá em Authentication > Users
   - Crie um novo usuário manualmente
   - No SQL Editor, execute:

   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
   ```

8. Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── admin/          # Componentes administrativos
│   ├── bookings/       # Componentes de agendamento
│   ├── layout/         # Componentes de layout
│   └── ui/             # Componentes UI base (shadcn)
├── context/            # Contextos React (Auth)
├── hooks/              # Custom hooks
├── lib/                # Utilitários e helpers
├── pages/              # Páginas da aplicação
├── types/              # Tipos TypeScript
└── data/               # Schemas SQL e seeds
```

## 🔐 Autenticação

O sistema utiliza Supabase Auth para autenticação. Não há opção pública de cadastro - apenas administradores podem criar novos usuários através da interface administrativa.

## 📊 Funcionalidades Principais

- ✅ Autenticação com RBAC (Roles e Permissões granulares)
- ✅ Timeline visual de agendamentos (05:50 - 19:00, slots de 10 minutos)
- ✅ Gestão de salas (CRUD, bloqueios, upload de fotos)
- ✅ Gestão de usuários (criação com senha temporária)
- ✅ Validações de negócio (duração máxima, antecedência, conflitos)
- ✅ Notificações por email com anexo .ics
- ✅ Dashboard de analytics para administradores
- ✅ Modal de termos LGPD
- ✅ Sistema de suporte/feedback

## 🎨 Branding

O sistema utiliza a identidade visual da Ponto Forte com:

- Fonte: Google Sans Flex
- Paleta de cores configurável no Tailwind
- Logo e favicon personalizados

## 📝 Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Build para produção
- `pnpm preview` - Preview do build de produção
- `pnpm lint` - Executa o linter

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso configuradas por role e permissão
- Service role key usado apenas em Edge Functions
- Variáveis de ambiente nunca commitadas

## 🔄 CI/CD - Integração Contínua

O projeto utiliza GitHub Actions para garantir a qualidade do código antes de merge para produção.

### Workflow Automático

O workflow de CI (`.github/workflows/ci.yml`) é executado automaticamente em:

- **Pull Requests** para a branch `main`
- **Push** em qualquer branch (exceto `main`)

### Etapas de Validação

1. Checkout do código
2. Setup do Node.js 18 e pnpm
3. Cache inteligente de dependências
4. Instalação de dependências
5. Execução do linter (`pnpm lint`)
6. Build da aplicação (`pnpm build`)
7. Verificação dos artefatos gerados

### Configurar Secrets no GitHub

Para que o workflow funcione corretamente, configure os seguintes secrets no repositório:

1. Acesse **Settings** → **Secrets and variables** → **Actions**
2. Adicione os seguintes secrets:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

### Configurar Branch Protection

Para garantir que código com erros não chegue à produção, configure proteção na branch `main`:

1. Acesse **Settings** → **Branches** → **Add rule**
2. Em "Branch name pattern", digite: `main`
3. Ative as seguintes opções:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (mínimo 1)
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - ✅ Adicione o check: `Build e Lint`
   - ✅ **Do not allow bypassing the above settings** (incluir administradores)

### Benefícios

- ✅ Validação automática de código em todos os PRs
- ✅ Detecção precoce de erros de build e linting
- ✅ Garantia de qualidade antes do merge
- ✅ Bloqueio automático de PRs com falhas
- ✅ Histórico completo de builds no GitHub Actions

### Monitoramento

Acompanhe o status dos builds na aba **Actions** do repositório. Cada PR mostrará o status do CI diretamente na interface.

## 📧 Notificações

O sistema envia emails transacionais via Resend quando:

- Uma reserva é confirmada
- O email inclui um anexo .ics para integração com calendários

**Nota:** A integração de emails requer configuração da API key do Resend nas variáveis de ambiente e nas Edge Functions do Supabase.

## 🚀 Deploy

O projeto está configurado para deploy em plataformas como Vercel ou Netlify:

1. Configure as variáveis de ambiente no painel de deploy
2. Execute `pnpm build`
3. O diretório `dist` contém os arquivos estáticos

## 📄 Licença

Este projeto é propriedade da Ponto Forte.

## 👥 Suporte

Para reportar problemas ou solicitar ajuda, use o botão "Reportar Problema" no rodapé da aplicação.
