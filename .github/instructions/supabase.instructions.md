---
description: "Use when working with Supabase schema, SQL migrations, database tables, functions, policies, authentication, Storage, RLS, or Supabase-related configuration."
name: "Supabase Development Instructions"
applyTo: ["supabase/**", "**/*.sql", "**/.env*", ".mcp.json"]
---

# Supabase instructions

## Required workflow

- Първо анализирай съществуващата схема, таблици, функции и политики, преди да предлагаш или извършваш промени.
- Работи на малки стъпки и проверявай всяка промяна.
- Всяка промяна на схемата се записва в отделен локален SQL migration файл в `supabase/migrations/`.
- Провери migration файла и го подготви за commit в GitHub; не изпълнявай commit или push без изрично указание.
- Преди прилагане на промяна в Supabase първо създай и прегледай съответния локален migration файл.
- Поддържай локалните миграции и Supabase схемата синхронизирани.

## Safety and access

- Не прави деструктивни промени без изрично разрешение.
- Не публикувай пароли, API ключове, service-role ключове или други тайни в код, миграции, документация, логове или Git.
- Защитавай достъпа до данни и файлове с Row Level Security (RLS) и подходящи политики.
- Не предполагай, че таблици, колони, функции или политики съществуват; потвърди ги в наличния проектен контекст.
- Използвай read-only проверка при диагностика, освен ако потребителят изрично не е разрешил промяна.
