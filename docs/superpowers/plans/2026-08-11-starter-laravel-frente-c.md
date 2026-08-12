# Starter e demo Laravel — Frente C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao ecossistema Laravel o mesmo par que Next e Vite já têm — `starter-laravel` (template de partida) e `starter-laravel-demo` (produto navegável, publicado) — sem Tailwind, com autenticação real via Fortify e as telas do Lyra em contexto de produto.

**Architecture:** Dois repositórios novos. O `starter-laravel` é um Laravel limpo com `lyra-ds/blade` + `@lyra-ds/styles` + `@lyra-ds/alpine`, tema e white-label ligados, e as sete views que o Fortify espera — presentes mas **sem** o Fortify instalado, para que quem não quer auth não pague nada. O `starter-laravel-demo` parte desse starter, liga o Fortify de verdade sobre SQLite, veste as telas de produto e absorve a galeria de 72 componentes do atual `blade-demo`, que é aposentado. O demo é publicado no Docploy self-hosted do usuário, via Dockerfile — por isso, diferente dos irmãos em GitHub Pages, o fluxo de auth funciona no ar.

**Tech Stack:** PHP 8.4, Laravel 13, Blade, Alpine.js 3, Vite (sem Tailwind), Pest 4, Pint, Laravel Fortify, SQLite, Docker/FrankenPHP, GitHub Actions.

**Escopo:** repositórios `lyra-ds/starter-laravel` e `lyra-ds/starter-laravel-demo`, ambos a criar. Independente das frentes A e B — não depende do `api.json` nem do seletor de stack.

**Spec:** `lyra-ds/lyra:docs/superpowers/specs/2026-08-10-documentacao-multi-stack-design.md`, §6.

## Global Constraints

- **Sem Tailwind em lugar nenhum.** O scaffold padrão do Laravel traz `@tailwindcss/vite` e `tailwindcss`; sai tudo, e o README diz por quê. É a vitrine de um DS cuja restrição travada é CSS-first.
- **`@lyra-ds/alpine` em `^0.4.0`** (o `blade-demo` atual está preso em `^0.3.0` e não mostra as duas props entregues em agosto).
- **Nada de CSS próprio para componentes.** Aparência vem de `@lyra-ds/styles`; CSS local só para layout de página do demo (grid, gutter), nunca reescrevendo `.lyra-*`.
- **Nenhuma prop inventada.** Contratos em `https://lyra-ds.dev` e `llms.txt`; se faltar componente, o certo é registrar a lacuna, não improvisar markup.
- **Pint é o style gate** nos dois repos; CI roda `vendor/bin/pint --test` e `vendor/bin/pest`.
- **O starter não instala Fortify.** Ele traz as views e a instrução; o demo é que liga.
- **Fontes:** `@fontsource/plus-jakarta-sans` e `@fontsource/jetbrains-mono` como dependência local, servidas pelo Vite — nunca CDN.
- **Commits em português**, convencionais (`feat:`, `chore:`, `docs:`), como nos outros repos da org.

## File Structure

### `lyra-ds/starter-laravel`

| Arquivo                                 | Responsabilidade                                                    |
| --------------------------------------- | ------------------------------------------------------------------- |
| `resources/css/app.css`                 | Importa `@lyra-ds/styles` e as fontes; regra pré-boot; sem Tailwind |
| `resources/js/app.js`                   | Registra o plugin Lyra e inicia o Alpine                            |
| `resources/views/layouts/app.blade.php` | Layout com `@lyraThemeScript` no `<head>`                           |
| `resources/views/auth/*.blade.php`      | As sete views do Fortify, escritas só com componentes do catálogo   |
| `resources/views/welcome.blade.php`     | Página inicial mínima que prova tema e white-label                  |
| `tests/Feature/AuthViewsTest.php`       | Toda view de auth renderiza e emite classes `.lyra-*`               |
| `tests/Feature/ThemeTest.php`           | `@lyraThemeScript` presente e chave de tema configurável            |
| `.github/workflows/ci.yml`              | Pint + Pest + build de assets                                       |
| `README.md` / `AGENTS.md`               | Uso do template, checklist pós-clone, regra de não inventar API     |

### `lyra-ds/starter-laravel-demo`

| Arquivo                                        | Responsabilidade                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `routes/web.php`                               | Rotas do produto + `/components`                                                 |
| `resources/views/app/*.blade.php`              | Dashboard, agenda, arquivos, equipe, configurações                               |
| `resources/views/components-gallery.blade.php` | Galeria dos 72, herdada do `blade-demo`                                          |
| `app/Providers/FortifyServiceProvider.php`     | Aponta o Fortify para as views do starter                                        |
| `database/seeders/DemoSeeder.php`              | Usuário de demonstração                                                          |
| `tests/Feature/RoutesTest.php`                 | Toda rota responde 200 e emite `.lyra-`                                          |
| `tests/Feature/AuthFlowTest.php`               | Login, registro, desafio 2FA e recovery code (o TOTP em si fica na prova manual) |
| `Dockerfile`                                   | Imagem única para o Docploy                                                      |
| `.github/workflows/ci.yml`                     | Pint + Pest + build                                                              |

---

## Parte 1 — `lyra-ds/starter-laravel`

### Task 1: Scaffold sem Tailwind

**Files:**

- Create: o repositório inteiro, a partir de `composer create-project laravel/laravel`
- Modify: `package.json`, `vite.config.js`, `resources/css/app.css`, `resources/js/app.js`
- Create: `resources/views/layouts/app.blade.php`
- Create: `tests/Feature/AssetsTest.php`

**Interfaces:**

- Produces: um app Laravel que builda e roda com o Lyra ligado. As tasks 2–4 e o demo inteiro partem daqui.

- [ ] **Step 1: Crie o projeto**

```bash
cd /home/franciscpd/Projects/lyra-ds
composer create-project laravel/laravel starter-laravel
cd starter-laravel
git init && git add -A && git commit -m "chore: scaffold inicial do Laravel"
```

O commit do scaffold cru entra sozinho — assim o diff da remoção do Tailwind fica legível para quem for auditar depois.

- [ ] **Step 2: Escreva o teste que proíbe o Tailwind**

Create `tests/Feature/AssetsTest.php`:

```php
<?php

it('ships no Tailwind dependency', function (): void {
    $manifest = json_decode((string) file_get_contents(base_path('package.json')), true);
    $dependencies = array_merge(
        $manifest['dependencies'] ?? [],
        $manifest['devDependencies'] ?? [],
    );

    foreach (array_keys($dependencies) as $name) {
        expect($name)->not->toContain('tailwind');
    }
});

it('imports the Lyra stylesheet exactly once', function (): void {
    $css = (string) file_get_contents(resource_path('css/app.css'));

    expect(substr_count($css, "@lyra-ds/styles"))->toBe(1)
        ->and($css)->not->toContain('tailwindcss');
});

it('registers the Lyra plugin before starting Alpine', function (): void {
    $js = (string) file_get_contents(resource_path('js/app.js'));
    $plugin = strpos($js, 'Alpine.plugin(lyra)');
    $start = strpos($js, 'Alpine.start()');

    expect($plugin)->not->toBeFalse()
        ->and($start)->not->toBeFalse()
        ->and($plugin)->toBeLessThan($start);
});
```

- [ ] **Step 3: Rode e veja falhar**

```bash
vendor/bin/pest --filter=Assets
```

Esperado: os três vermelhos — o scaffold tem Tailwind e não conhece o Lyra.

- [ ] **Step 4: Troque as dependências**

```bash
npm uninstall tailwindcss @tailwindcss/vite
npm install @lyra-ds/styles @lyra-ds/alpine@^0.4.0 alpinejs @fontsource/plus-jakarta-sans @fontsource/jetbrains-mono
```

`resources/css/app.css` inteiro:

```css
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@lyra-ds/styles/styles.css';

/*
 * Antes do Alpine bootar, um menu ou diálogo fechado ainda não recebeu x-show —
 * sem esta regra ele pisca aberto no primeiro paint. O pacote de styles não a
 * embarca porque ela é uma decisão da aplicação, não do design system.
 */
[x-cloak] {
  display: none !important;
}
```

`resources/js/app.js` inteiro:

```js
import Alpine from 'alpinejs';
import lyra from '@lyra-ds/alpine';

Alpine.plugin(lyra);
Alpine.start();
```

Em `vite.config.js`, remova o import e o plugin do `tailwindcss`, mantendo só o `laravel({ input: [...], refresh: true })`.

- [ ] **Step 5: Layout com o script de tema**

Create `resources/views/layouts/app.blade.php`:

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>

    {{-- Antes das folhas de estilo: aplica o tema guardado no primeiro paint. --}}
    @lyraThemeScript

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    {{ $slot ?? '' }}
    @yield('content')
</body>
</html>
```

- [ ] **Step 6: Rode tudo**

```bash
npm run build
vendor/bin/pest
vendor/bin/pint --test
```

Esperado: build sem Tailwind, os três testes verdes, Pint limpo.

- [ ] **Step 7: Commit**

```bash
vendor/bin/pint
git add -A
git commit -m "feat: liga o Lyra DS e remove o Tailwind do scaffold"
```

---

### Task 2: As sete views do Fortify

Escritas **só com componentes do catálogo** — cobertura já verificada: `input`, `checkbox`, `button`, `alert`, `card`, `brand`, `separator`, `form-row`, `fieldset`, `spinner`, `icon`, `stack`, `container` existem todos no `lyra-ds/blade` 0.10.0. Atenção ao contrato do `brand`: a prop `mark` é **obrigatória** (sem default) — `<lyra:brand />` sem ela quebra a renderização.

**Files:**

- Create: `resources/views/auth/{login,register,forgot-password,reset-password,verify-email,confirm-password,two-factor-challenge}.blade.php`
- Create: `tests/Feature/AuthViewsTest.php`

**Interfaces:**

- Produces: as views nos nomes exatos que o Fortify resolve (`auth.login`, `auth.register`, …). O demo (task 7) as aponta sem renomear nada.

- [ ] **Step 1: Escreva o teste**

Create `tests/Feature/AuthViewsTest.php`:

```php
<?php

use Illuminate\Support\Facades\View;

dataset('auth views', [
    'auth.login',
    'auth.register',
    'auth.forgot-password',
    'auth.reset-password',
    'auth.verify-email',
    'auth.confirm-password',
    'auth.two-factor-challenge',
]);

it('renders every Fortify view with Lyra markup', function (string $view): void {
    $html = View::make($view, ['request' => request()])->render();

    expect(trim($html))->not->toBe('')
        ->and($html)->toContain('lyra-');
})->with('auth views');

it('never falls back to raw HTML controls', function (string $view): void {
    $html = View::make($view, ['request' => request()])->render();

    // Allowlist única: inputs type="hidden" (o token do reset-password não tem
    // representação visual). Todo controle visível precisa vir do catálogo.
    expect($html)->not->toMatch('/<input(?![^>]*type="hidden")(?![^>]*class="[^"]*lyra-)/')
        ->and($html)->not->toMatch('/<button(?![^>]*class="[^"]*lyra-)/');
})->with('auth views');
```

O segundo teste é o que dá valor ao exercício: ele falha se alguém resolver um campo com `<input>` cru em vez do componente. É essa a prova de cobertura do catálogo.

- [ ] **Step 2: Rode e veja falhar**

```bash
vendor/bin/pest --filter=AuthViews
```

Esperado: 14 casos vermelhos, todos por view inexistente.

- [ ] **Step 3: Escreva o login**

Create `resources/views/auth/login.blade.php`:

```blade
@extends('layouts.app')

@section('content')
<lyra:container max="sm">
    <lyra:card>
        <lyra:brand :mark="asset('logo.svg')" />
        <h1>Sign in</h1>

        @if (session('status'))
            <lyra:alert tone="success">{{ session('status') }}</lyra:alert>
        @endif

        @error('email')
            <lyra:alert tone="danger">{{ $message }}</lyra:alert>
        @enderror

        <form method="POST" action="/login">
            @csrf

            <lyra:input
                name="email"
                type="email"
                label="Email address"
                autocomplete="email"
                required
                :value="old('email')"
            />

            <lyra:input
                name="password"
                type="password"
                label="Password"
                autocomplete="current-password"
                required
            />

            <lyra:checkbox name="remember" label="Remember me" />

            <lyra:button type="submit" variant="primary" full>Sign in</lyra:button>
        </form>

        <lyra:separator />

        <a href="/forgot-password">Forgot your password?</a>
    </lyra:card>
</lyra:container>
@endsection
```

Confira cada prop contra `resources/views/components/*.blade.php` do `lyra-ds/blade` **antes** de rodar — prop inventada aqui é o erro que este starter existe para não cometer.

- [ ] **Step 4: Escreva as outras seis**

Mesma forma. Notas por tela:

- **register** — nome, email, senha e confirmação; o `password_confirmation` é o nome que o Fortify espera.
- **forgot-password** — só email, e a `session('status')` em `alert` de sucesso.
- **reset-password** — email, senha, confirmação, mais `<input type="hidden" name="token" value="{{ $request->route('token') }}">`. Esse hidden é o **único** input cru aceitável: ele não tem representação visual, e o regex do Step 1 já ignora `type="hidden"` de saída, com o porquê em comentário.
- **verify-email** — texto, botão de reenviar, sem campos.
- **confirm-password** — só senha.
- **two-factor-challenge** — um `input` de código com `inputmode="numeric"` e `autocomplete="one-time-code"`, mais alternância para código de recuperação. **Aqui está a única lacuna conhecida de catálogo:** não existe componente dedicado de código OTP; sai como `input` comum. Se ao escrever a tela isso incomodar, abra uma issue no `lyra-ds/lyra` descrevendo o componente que faltou — é um achado legítimo, não um defeito deste starter.

- [ ] **Step 5: Rode até verde**

```bash
vendor/bin/pest --filter=AuthViews
```

Esperado: 14 verdes.

- [ ] **Step 6: Commit**

```bash
vendor/bin/pint
git add resources/views/auth tests/Feature/AuthViewsTest.php
git commit -m "feat: views de autenticação do Fortify escritas com o catálogo Lyra"
```

---

### Task 3: Tema, white-label e a página inicial

**Files:**

- Modify: `resources/views/welcome.blade.php`
- Create: `tests/Feature/ThemeTest.php`

- [ ] **Step 1: Escreva o teste**

Create `tests/Feature/ThemeTest.php`:

```php
<?php

it('emits the pre-paint theme script in the layout', function (): void {
    $html = $this->get('/')->getContent();

    expect($html)->toContain('data-lyra-theme-key')
        ->and($html)->toContain('lyra-theme');
});

it('renders the landing page with Lyra components', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertSee('lyra-btn', escape: false);
});
```

- [ ] **Step 2: Rode e veja falhar**

```bash
vendor/bin/pest --filter=Theme
```

- [ ] **Step 3: Escreva a página inicial**

`welcome.blade.php` estende o layout e mostra, em uma tela: o `brand`, um par de `button` de cada variante, um `card` com `input` e `switch`, o alternador de tema (`$store.theme.toggle()` como no `blade-demo` atual) e um seletor de white-label que troca `data-brand` no `<html>` — os quatro tokens da marca em ação, que é o argumento de venda do DS.

- [ ] **Step 4: Rode e commite**

```bash
vendor/bin/pest
vendor/bin/pint
git add resources/views/welcome.blade.php tests/Feature/ThemeTest.php
git commit -m "feat: página inicial com tema e white-label ao vivo"
```

---

### Task 4: README, AGENTS e CI

**Files:**

- Create: `README.md`, `AGENTS.md`, `.github/workflows/ci.yml`

- [ ] **Step 1: CI**

Create `.github/workflows/ci.yml`, espelhando o do `lyra-ds/blade` (matriz PHP 8.3/8.4) com os passos: `composer install`, `vendor/bin/pint --test`, `vendor/bin/pest`, `npm ci`, `npm run build`.

- [ ] **Step 2: README**

No molde do `starter-next`: o que é, **[See the live demo →]** apontando para a URL do `starter-laravel-demo`, "Use this template", instalação, e duas seções que só existem aqui:

1. **Autenticação (opcional)** — `composer require laravel/fortify`, publicar, e apontar as views:

```php
Fortify::loginView(fn () => view('auth.login'));
Fortify::registerView(fn () => view('auth.register'));
Fortify::requestPasswordResetLinkView(fn () => view('auth.forgot-password'));
Fortify::resetPasswordView(fn (Request $request) => view('auth.reset-password', ['request' => $request]));
Fortify::verifyEmailView(fn () => view('auth.verify-email'));
Fortify::confirmPasswordView(fn () => view('auth.confirm-password'));
Fortify::twoFactorChallengeView(fn () => view('auth.two-factor-challenge'));
```

2. **Por que não há Tailwind** — três linhas: o Lyra é CSS-first, o mesmo CSS serve React, HTML e Blade, e adicionar Tailwind aqui contradiria o que o template demonstra. Quem quiser, instala; não é proibido no seu app, é ausente no ponto de partida.

Inclua também o checklist "After cloning" (renomear no `composer.json`, trocar `APP_NAME`, editar os tokens de marca), como o `starter-next` faz.

- [ ] **Step 3: AGENTS.md**

Copie a estrutura do `starter-next/AGENTS.md`, trocando os links de pacote: `lyra-ds/blade` (Packagist), `@lyra-ds/styles` e `@lyra-ds/alpine` (npm), docs em `lyra-ds.dev`, e a regra **"nunca invente API de componente Lyra"** com o ponteiro para `llms.txt`.

- [ ] **Step 4: Publique o repositório**

```bash
gh repo create lyra-ds/starter-laravel --public --source=. --remote=origin --push
gh repo edit lyra-ds/starter-laravel --enable-issues --template
```

`--template` é o que faz aparecer o botão **Use this template**, que é o ponto do repo.

- [ ] **Step 5: Confirme o CI verde**

```bash
gh run watch
```

---

## Parte 2 — `lyra-ds/starter-laravel-demo`

### Task 5: Derivar o demo do starter

**Files:**

- Create: o repositório, a partir de um clone do `starter-laravel`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Crie a partir do template**

```bash
cd /home/franciscpd/Projects/lyra-ds
gh repo create lyra-ds/starter-laravel-demo --public --template lyra-ds/starter-laravel --clone
cd starter-laravel-demo
composer install && npm install
vendor/bin/pest
```

Esperado: a suíte herdada verde antes de qualquer mudança. Se não estiver, o problema é do starter, e é lá que se conserta.

- [ ] **Step 2: Ajuste identidade e commit**

`APP_NAME`, nome no `composer.json`, README apontando que este é o demo do `starter-laravel` — não um template.

```bash
git add -A && git commit -m "chore: identidade do repositório de demonstração"
```

---

### Task 6: A galeria dos 72 migra

**Files:**

- Create: `resources/views/components-gallery.blade.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/GalleryTest.php`

**Interfaces:**

- Consumes: `blade-demo/resources/views/demo.blade.php` (884 linhas) como matéria-prima.
- Produces: rota `/components`.

- [ ] **Step 1: Escreva o teste de cobertura**

Create `tests/Feature/GalleryTest.php`:

```php
<?php

it('renders the gallery route', function (): void {
    $this->get('/components')->assertOk()->assertSee('lyra-', escape: false);
});

it('covers every component the package ships', function (): void {
    $installed = collect(glob(base_path('vendor/lyra-ds/blade/resources/views/components/*.blade.php')) ?: [])
        ->map(fn (string $path): string => basename($path, '.blade.php'));

    $gallery = (string) file_get_contents(resource_path('views/components-gallery.blade.php'));

    $missing = $installed->reject(fn (string $slug): bool => str_contains($gallery, "<lyra:{$slug}"));

    expect($missing->all())->toBe([], 'componentes ausentes da galeria: '.$missing->implode(', '));
});
```

O segundo teste é o que preserva a prova de cobertura que o `blade-demo` dava — e a torna automática, o que ela nunca foi.

- [ ] **Step 2: Rode e veja falhar**

```bash
vendor/bin/pest --filter=Gallery
```

- [ ] **Step 3: Migre o conteúdo**

Copie o corpo de `blade-demo/resources/views/demo.blade.php` para `components-gallery.blade.php`, adaptando: estende `layouts.app` (o `<head>` já vem de lá), remove as classes utilitárias remanescentes do Tailwind se houver, e agrupa os blocos por seção com âncoras. Registre a rota:

```php
Route::view('/components', 'components-gallery')->name('components');
```

- [ ] **Step 4: Rode até verde e commite**

```bash
vendor/bin/pest --filter=Gallery
vendor/bin/pint
git add resources/views/components-gallery.blade.php routes/web.php tests/Feature/GalleryTest.php
git commit -m "feat: galeria dos componentes migrada do blade-demo, com cobertura sob teste"
```

---

### Task 7: Fortify de verdade

**Files:**

- Modify: `composer.json`, `routes/web.php`
- Create: `app/Providers/FortifyServiceProvider.php`
- Create: `database/seeders/DemoSeeder.php`
- Create: `tests/Feature/AuthFlowTest.php`

- [ ] **Step 1: Escreva o teste de fluxo**

Create `tests/Feature/AuthFlowTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('serves the login screen', function (): void {
    $this->get('/login')->assertOk()->assertSee('lyra-btn', escape: false);
});

it('signs a user in with valid credentials', function (): void {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function (): void {
    User::factory()->create(['email' => 'demo@example.com', 'password' => bcrypt('password')]);

    $this->post('/login', ['email' => 'demo@example.com', 'password' => 'wrong'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('registers a new user', function (): void {
    $this->post('/register', [
        'name' => 'Ana',
        'email' => 'ana@example.com',
        'password' => 'password-longa',
        'password_confirmation' => 'password-longa',
    ])->assertRedirect('/dashboard');

    $this->assertDatabaseHas('users', ['email' => 'ana@example.com']);
});

it('sends a 2FA-enabled user to the challenge screen', function (): void {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $user->forceFill([
        'two_factor_secret' => encrypt('base32-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['RECOVERY-ONE', 'RECOVERY-TWO'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect('/two-factor-challenge');

    $this->assertGuest();
});

it('signs in through a recovery code', function (): void {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $user->forceFill([
        'two_factor_secret' => encrypt('base32-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['RECOVERY-ONE', 'RECOVERY-TWO'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->post('/login', ['email' => $user->email, 'password' => 'password']);

    $this->post('/two-factor-challenge', ['recovery_code' => 'RECOVERY-ONE'])
        ->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user->fresh());
});
```

O desafio TOTP em si (código de 6 dígitos válido) e a tela de confirmação de senha ficam
para a prova manual do fluxo completo (Task de verificação final) — gerar códigos TOTP
sintéticos no Pest exigiria fixar o relógio e o segredo do Fortify, e o código de
recuperação já prova o caminho do desafio de ponta a ponta.

- [ ] **Step 2: Rode e veja falhar**

```bash
vendor/bin/pest --filter=AuthFlow
```

Esperado: 404 em `/login` — o Fortify ainda não está instalado.

- [ ] **Step 3: Instale e aponte para as views**

```bash
composer require laravel/fortify
php artisan vendor:publish --provider="Laravel\Fortify\FortifyServiceProvider"
php artisan migrate
```

Em `app/Providers/FortifyServiceProvider.php`, registre as sete views exatamente como o README do starter descreve, e habilite o 2FA em `config/fortify.php` (`Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`).

- [ ] **Step 4: SQLite e usuário de demonstração**

`.env.example` com `DB_CONNECTION=sqlite` e `DB_DATABASE=/app/database/database.sqlite`. Create `database/seeders/DemoSeeder.php` criando `demo@lyra-ds.dev` com senha fixa **documentada no README** — é um demo público, a senha é parte da vitrine, não um segredo. Duas exigências de contrato:

- **Idempotente por construção**: use `User::firstOrCreate(['email' => …], […])` — o seeder
  roda em todo boot do container (ver Dockerfile) e não pode duplicar nem sobrescrever a
  conta num volume persistente.
- **Registrado no fluxo padrão**: adicione `$this->call(DemoSeeder::class);` no `run()` do
  `DatabaseSeeder` — `php artisan db:seed --force` executa o `DatabaseSeeder`, e sem esse
  vínculo a conta demo nunca nasce.

- [ ] **Step 5: Rode até verde e commite**

```bash
vendor/bin/pest
vendor/bin/pint
git add -A
git commit -m "feat: autenticação real com Fortify sobre SQLite"
```

---

### Task 8: As telas de produto

O que separa "galeria" de "produto": componentes aparecendo onde fazem sentido, dentro de um shell, com dados plausíveis.

**Files:**

- Create: `resources/views/app/{dashboard,schedule,files,team,settings}.blade.php`
- Create: `resources/views/layouts/shell.blade.php`
- Modify: `routes/web.php`
- Create: `tests/Feature/RoutesTest.php`

- [ ] **Step 1: Escreva o teste das rotas**

Create `tests/Feature/RoutesTest.php`:

```php
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

dataset('product routes', ['/dashboard', '/schedule', '/files', '/team', '/settings']);

it('requires authentication', function (string $route): void {
    $this->get($route)->assertRedirect('/login');
})->with('product routes');

it('renders for a signed-in user', function (string $route): void {
    $this->actingAs(User::factory()->create())
        ->get($route)
        ->assertOk()
        ->assertSee('lyra-', escape: false);
})->with('product routes');
```

- [ ] **Step 2: Rode e veja falhar**

```bash
vendor/bin/pest --filter=Routes
```

- [ ] **Step 3: Construa o shell e as telas**

`layouts/shell.blade.php` usa `<lyra:shell>` com `<lyra:app-sidebar>` e a navegação por `<lyra:nav-link>`; cada tela estende esse shell:

| Rota         | Componentes em contexto                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `/dashboard` | `stat` (4 cartões), `data-table` de atividade recente, `page-header`    |
| `/schedule`  | `calendar`, `slot-picker`, `time-zone-picker`                           |
| `/files`     | `file-manager`, `file-upload`, `empty-state`                            |
| `/team`      | `data-table` com `person-cell`, `avatar`, `dropdown` de ações           |
| `/settings`  | `fieldset`/`form-row`, `input`, `switch`, `segmented-control`, `select` |

Dados fixos em arrays no controller ou na própria rota — este é um demo, não precisa de banco além do de auth.

- [ ] **Step 4: Rode até verde e commite**

```bash
vendor/bin/pest
vendor/bin/pint
git add -A
git commit -m "feat: telas de produto do demo com o shell do Lyra"
```

---

### Task 9: Docker e deploy no Docploy

**Files:**

- Create: `Dockerfile`, `.dockerignore`
- Modify: `README.md`

**Interfaces:**

- Produces: uma imagem única que serve o app na porta 80, sem serviço externo de banco.

- [ ] **Step 1: Escreva o Dockerfile**

```dockerfile
# Assets primeiro: o build do Vite não precisa do PHP, e separar as camadas
# evita reconstruir o mundo a cada mudança de template.
FROM node:24-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json vite.config.js ./
RUN npm ci
COPY resources ./resources
RUN npm run build

FROM dunglas/frankenphp:php8.4
WORKDIR /app

RUN install-php-extensions pdo_sqlite opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

COPY . .
COPY --from=assets /app/public/build ./public/build

# O banco do demo é um arquivo: sem serviço externo, e um volume no Docploy
# preserva os usuários registrados entre deploys. Sem volume, cada deploy
# recomeça do seeder — aceitável para uma vitrine. O db:seed do CMD roda em
# TODO boot: só é seguro porque o DemoSeeder é idempotente (firstOrCreate) —
# ele recria a conta demo se o volume for descartado e não toca em nada que
# já exista. Se o seeder um dia deixar de ser idempotente, troque por uma
# guarda de primeiro boot (arquivo-marcador no volume).
RUN mkdir -p database && touch database/database.sqlite \
    && composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache database

ENV SERVER_NAME=:80
EXPOSE 80

CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && frankenphp run --config /etc/caddy/Caddyfile"]
```

- [ ] **Step 2: Prove a imagem localmente**

```bash
docker build -t starter-laravel-demo .
docker run --rm -p 8080:80 -e APP_KEY="$(php artisan key:generate --show)" starter-laravel-demo
```

Em outro terminal:

```bash
curl -sf http://localhost:8080/ > /dev/null && echo "home ok"
curl -sf http://localhost:8080/login | grep -q "lyra-btn" && echo "login com markup Lyra"
curl -sf http://localhost:8080/components | grep -q "lyra-" && echo "galeria ok"
```

Esperado: as três linhas. Se o `login` responder sem `lyra-btn`, o build de assets não entrou na imagem — confira a cópia de `public/build`.

- [ ] **Step 3: Publique no Docploy**

Crie a aplicação apontando para o repositório, build por Dockerfile, com:

- `APP_KEY` gerada e fixada como variável de ambiente (sem ela, cada deploy invalida sessões);
- `APP_URL` com o domínio real;
- `APP_ENV=production`, `APP_DEBUG=false`;
- volume persistente em `/app/database` se quiser preservar os cadastros.

- [ ] **Step 4: Verifique no ar**

Registre uma conta pelo formulário, ative o 2FA, saia e entre de novo. É o fluxo inteiro — e o argumento que só um demo com PHP de verdade consegue fazer.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore README.md
git commit -m "feat: imagem Docker e instruções de deploy"
```

---

### Task 10: Fechar o circuito

**Files:**

- Modify: `lyra-ds/lyra:apps/docs` (links para o demo)
- Modify: `lyra-ds/blade:README.md`
- Arquivar: `lyra-ds/blade-demo`

- [ ] **Step 1: Do site para o demo**

Na página de cada componente, na aba Blade, um link para a tela do demo onde ele aparece em contexto. O mapeamento componente → rota é uma tabela pequena; guarde-a junto do manifesto, em `apps/docs/lib/components.ts`, e não espalhe URLs pelo MDX.

- [ ] **Step 2: Do demo para o site**

Cada seção da galeria linka a doc do componente correspondente (`https://lyra-ds.dev/en/components/<slug>?stack=blade`).

- [ ] **Step 3: Do Packagist para o site**

O README do `lyra-ds/blade` ganha, no topo, o link para `lyra-ds.dev` como fonte de verdade da API e para o demo ao vivo — cumprindo o que o PRD daquele repo já declarava.

- [ ] **Step 4: Aposente o `blade-demo`**

```bash
gh repo archive lyra-ds/blade-demo --yes
```

Com um commit final no README dele apontando para `starter-laravel-demo`. Só depois que o demo novo estiver no ar e navegável — repositório arquivado não aceita mais commits.

---

## Notas de execução

- **Ordem obrigatória:** 1 → 2 → 3 → 4 (starter publicado) → 5 → 6 → 7 → 8 → 9. A task 10 fecha, e depende também da task 12 da Frente B para o link do site fazer sentido.
- **O starter é o produto; o demo é a prova.** Toda correção descoberta no demo que também vale para o starter volta para lá — o demo nasce do template, e não pode divergir dele em nada que seja estrutura.
- **A única lacuna de catálogo conhecida** é o campo de código OTP do `two-factor-challenge`. Se aparecer outra ao escrever as telas, ela é um achado a registrar no `lyra-ds/lyra`, não um motivo para inventar markup local.
- **Nada aqui depende das frentes A e B.** As três podem correr em paralelo; só a task 10 espera.
