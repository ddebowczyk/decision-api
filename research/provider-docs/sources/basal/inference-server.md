BASAL-SERVE / SILNIK 2.1

# Twoje modele. Jeden interfejs decyzyjny.

Model dostarcza prawdopodobieństwa. Serwer inferencji zamienia je w odpowiedź, z której może skorzystać Twoja aplikacja, workflow lub agent AI.

`basal-serve` uruchamia wagi, obsługuje zapytania i zwraca typowane, skalibrowane decyzje. Wybierasz model oraz sprzęt. Sposób zadawania pytań pozostaje ten sam.

[Połącz z agentem przez MCP](https://basal.si5.pl/serwer-inferencji/#mcp) [Zobacz API ↗](https://basal.si5.pl/serwer-inferencji/#api)

Otwarty kod · Apache 2.0 · własna infrastruktura

OD PYTANIA DO DECYZJI

AplikacjaWorkflowAgent AI

↓ HTTP / MCP ↓

TWÓJ SERWER**basal-serve**

lokalnie

Zapytania · kolejka · kalibracja

↓

TEKST**basal-2.0**

TEKST / OBRAZ / DŹWIĘK**basal-omni**

Jeden wybrany model na proces serwera

ODPOWIEDŹ DLA TWOJEGO KODU**Decyzja + prawdopodobieństwa**

`choice``noul``score``multi``act``tool`

ZADANIA 2.1`classify``verify``compress``extract`

[Jak działa](https://basal.si5.pl/serwer-inferencji/#dzialanie)[Typy pytań](https://basal.si5.pl/serwer-inferencji/#schematy)[Zadania 2.1](https://basal.si5.pl/serwer-inferencji/#zadania)[Sprzęt i silniki](https://basal.si5.pl/serwer-inferencji/#sprzet)[HTTP API](https://basal.si5.pl/serwer-inferencji/#api)[MCP dla agentów](https://basal.si5.pl/serwer-inferencji/#mcp)[Ustawienia](https://basal.si5.pl/serwer-inferencji/#ustawienia)

01 / WARSTWA MIĘDZY MODELEM A APLIKACJĄ

## Od wag do działającej usługi.

Wagi przechowują to, czego nauczył się model. Silnik określa, jak z tej wiedzy korzysta Twój program.

01

### Przyjmuje Twoje zasady

Przesyłasz stan, pytania i dozwolone odpowiedzi. Serwer sprawdza strukturę zapytania i przygotowuje wejście dla modelu. Klasyfikator definiujesz przy każdym wywołaniu.

02

### Współdzieli obliczenia

SOAM (State Once, Ask Many) pozwala wielu pytaniom korzystać z tego samego stanu. Silnik może też łączyć równoległe zapytania w partie, aby lepiej wykorzystać GPU.

03

### Zwraca wynik w kontrakcie API

Odczytuje prawdopodobieństwa opcji, stosuje kalibrację i buduje odpowiedź JSON. Dla decyzji kosztowej oblicza oczekiwany koszt działań; w razie potrzeby zwraca przekazanie sprawy człowiekowi.

vLLM, SGLang, MLX, Ollama i llama.cpp mogą wykonywać obliczenia modelu. Warstwę typowanych decyzji zapewnia przed nimi basal-serve. Zwykłe uruchomienie modelu w trybie generowania tekstu nie daje tego samego API.

02 / PYTASZ O WYNIK, NIE O AKAPIT

## Sześć typów decyzji. Cztery zadania z nich złożone.

Łącz różne typy pytań w jednym zapytaniu. Dla basal-2.0 dostępnych jest do 255 opcji na pytanie; tryb Ollama ma limit 20.

`choice`

### Jedna z opcji

Który zespół powinien obsłużyć zgłoszenie? Dostajesz wybraną opcję i rozkład prawdopodobieństw.

`noul`

### Tak czy nie

Czy opis zawiera numer zamówienia? Wynikiem jest prawdopodobieństwo odpowiedzi „tak”.

`score`

### Ocena na skali

Jak pilna jest sprawa? Definiujesz uporządkowane poziomy, a serwer zwraca rozkład i wartość oczekiwaną poziomu.

`multi`

### Wiele pasujących etykiet

Reklamacja, dostawa i zwrot mogą dotyczyć jednej wiadomości. Każda etykieta ma niezależne prawdopodobieństwo; ich suma nie musi wynosić 100%.

`act`eksperymentalne

### Działanie z uwzględnieniem kosztu

Podajesz koszty działań dla możliwych wyników. Serwer wybiera najniższy oczekiwany koszt, także gdy najlepszym działaniem jest konsultacja z człowiekiem.

`tool`eksperymentalne

### Następne narzędzie agenta

Przekazujesz definicje narzędzi w formacie MCP, OpenAI lub Anthropic. basal wybiera narzędzie, odpowiedź bez narzędzia, pytanie do użytkownika albo brak pasującej opcji.

`classify`basal 2.1 · eksperymentalne

### Etykiety z opisem

Podajesz etykiety i krótki opis każdej. Dostajesz etykietę, prawdopodobieństwo każdej z nich i opcjonalnie „żadna z powyższych”. Do 255 etykiet.

`verify`basal 2.1 · eksperymentalne

### Czy twierdzenia wynikają z tekstu

Dla każdego twierdzenia: potwierdzone, zaprzeczone albo niewynikające ze stanu, z prawdopodobieństwami. Sprawdza pola z innego systemu albo zdania odpowiedzi modelu generatywnego.

`compress`basal 2.1 · eksperymentalne

### Tylko potrzebne fragmenty

Zdania, wiersze lub akapity dokumentu potrzebne do pytania, jako krótszy tekst dla innego modelu. Każdy fragment ma prawdopodobieństwo.

`extract`basal 2.1 · eksperymentalne

### Pola schematu JSON

Wartości skopiowane dokładnie z dokumentu, z pozycją znaków, albo wybrane z listy enum. Bez generowania tekstu, więc wartość zawsze pochodzi z dokumentu.

[![


Twoja przeglądarka nie obsługuje wideo. [Pobierz film MP4](https://basal.si5.pl/assets/films/basal-schematy-PL.mp4).

](/assets/films/basal-schematy.jpg?v=1)](/assets/films/basal-schematy-PL.mp4?v=1)

Napisy
Polski
English
Wyłączone

Film (16 min, polski lektor, napisy PL i EN): każdy schemat pytania na pełnym przykładzie JSON, SOAM, zadania 2.1, kalibracja i progi. Prawdopodobieństwa w filmie są dydaktyczne — to nie są pomiary modelu.

[Pobierz film MP4 ↓](https://basal.si5.pl/assets/films/basal-schematy-PL.mp4)[Napisy PL · SRT ↓](https://basal.si5.pl/assets/films/basal-schematy-PL.srt)[Napisy EN · SRT ↓](https://basal.si5.pl/assets/films/basal-schematy-EN.srt)

**Fakty przed decyzją.** `"facts": "auto"` uzupełnia polski stan o obliczone daty i kwoty. Kod wykonuje rachunki; model ocenia znaczenie faktów w opisanych zasadach procesu.

03 / BASAL 2.1 · EKSPERYMENTALNE

## Zadania złożone z decyzji.

Silnik v2.1.0 dodaje cztery typy zadań w tym samym API, dla modeli, które już uruchamiasz. Każde zadanie silnik rozkłada na decyzje modelu nad wspólnym stanem: model nie pisze tekstu, a każda część odpowiedzi ma prawdopodobieństwo.

POST /v1/basal · classifyKopiuj JSON

```
{
  "state": "I was charged twice for my card payment yesterday.",
  "questions": {
    "intent": {
      "type": "classify",
      "none": true,
      "labels": [
        {"name": "card_payment_duplicate", "rubric": "a card payment was taken more than once"},
        {"name": "card_lost", "rubric": "the card is lost or stolen"},
        {"name": "refund_status", "rubric": "asks about a refund in progress"}
      ]
    }
  }
}
```

answers.intent · zmierzone

```
{
  "type": "classify",
  "label": "card_payment_duplicate",
  "scores": {
    "card_payment_duplicate": 0.9996,
    "card_lost": 0.0002,
    "refund_status": 0.0000,
    "none": 0.0002
  },
  "confidence": 0.9996,
  "automated": {"0.01": null, "0.05": null},
  "experimental": true
}
```

### Rzeczywista odpowiedź modelu

basal-omni-1.0-max, silnik v2.1.0, tryb eager, bf16, jedno H100; wartości zaokrąglone do czterech miejsc. Dwa kolejne wywołania dały identyczną odpowiedź.

`classify`
:   Etykiety z opisem; jedna etykieta albo kilka (multi\_label).

`verify`
:   Twierdzenia: potwierdzone, zaprzeczone, niewynikające ze stanu.

`compress`
:   Jedno pytanie tak/nie o każdy fragment; zostają najbardziej potrzebne.

`extract`
:   Dla pola tekstowego: który wiersz, potem który fragment wiersza. Wartość zawsze jest dokładnym tekstem dokumentu.

**automated.** Wartość true lub false pojawia się tylko z progiem certyfikowanym dla danego zadania (task\_thresholds w pliku kalibracji). Bez takiego progu jest null: progi zwykłych decyzji nie przenoszą się na nowe zestawy etykiet (przy celu 1% od 2 do 9% błędów).

Wyniki zadań · basal-omni-1.0-max · silnik v2.1.0 · testowany na zbiorach testowych (5 publicznych, 1 syntetyczny)

| Zadanie | Zbiór | Pytania | Wynik |
| --- | --- | --- | --- |
| `classify` | CLINC150 „plus”, 151 etykiet z out-of-scope | 1 000 | 85,4% trafności |
| `classify` | BANKING77, 77 etykiet | 1 000 | 74,6% trafności |
| `verify` | VitaminC, trzy odpowiedzi | 1 000 | 80,3% trafności |
| `verify` | RAGTruth, odpowiedź vs źródło | 1 000 | 80,3% trafności |
| `compress` | QASPER, akapity, 30% znaków | 248 | 90,1% potrzebnych akapitów zachowanych |
| `extract` | syntetyczne faktury PL / EN, 12 pól | 400 | 90,1% pól poprawnych |

### basal-omni-1.1-max · od 17.10

Wariant max z dodatkowym treningiem na formatach zadań. Średnia z sześciu zbiorów rośnie z 83,5 do 85,1. Kontrola nakładania się danych: 27 pytań testowych (12 VitaminC, 15 QASPER) dzieli 13-wyrazowy fragment z danymi treningowymi; bez nich zyski wynoszą +4,2 i +2,7 pkt, a średnia nadal 85,1. W ogólnych decyzjach jest nieco słabszy od 1.0-max (Werdykt 0,821 wobec 0,823), który pozostaje modelem domyślnym. Szczegóły na karcie modelu.

### Streszczenia z innym modelem

basal nie pisze tekstu. compress wybiera fragmenty dokumentu do pytania, model generatywny pisze streszczenie, a verify sprawdza każde jego zdanie względem oryginału. Zdania niepotwierdzone trafiają do przeglądu.

### Ograniczenia

API zadań może się zmienić w wersji pośredniej. extract nie zwraca jeszcze list obiektów (pozycji faktury) ani pól tekstowych z obrazu. Koszt compress rośnie z liczbą fragmentów: artykuł z 5 000 słów dzielony na akapity to ok. 27 s na H100.

Pełny opis i parametry: [TASKS.md ↗](https://github.com/rkinas/basal/blob/v2.1.0/docs/TASKS.md) · wszystkie typy na jednej stronie: [QUESTION\_TYPES.md ↗](https://github.com/rkinas/basal/blob/v2.1.0/docs/QUESTION_TYPES.md)

04 / WYBIERASZ ŚRODOWISKO

## Serwer, Mac albo CPU.

Ten sam punkt wejścia do decyzji, różne sposoby wykonania obliczeń. Tryb dobierasz do sprzętu, wag i ruchu aplikacji.

| Środowisko | Tryb | Co warto wiedzieć |
| --- | --- | --- |
| NVIDIA GPU · tekst | `fast` `fast-nocompile` | Główny silnik PyTorch. Kompilacja i CUDA graphs w fast; szybszy start bez kompilacji w fast-nocompile. |
| NVIDIA GPU · FP8 | `fp8` | Porty FP8 na zgodnym GPU. HP ZGX Nano (NVIDIA DGX Spark) wymaga stosu CUDA dobranego do Blackwell. |
| Apple Silicon | `mlx` `mps` | MLX z portami 8-bit albo PyTorch na GPU Maca. Używaj kalibracji właściwej dla wybranego silnika. |
| CPU i lokalne pliki GGUF | `eager --device cpu` `gguf` / `ollama` / `llamacpp` | PyTorch na CPU lub pliki GGUF. Dla Ollama i llama.cpp basal-serve łączy się z osobno uruchomionym serwerem. |
| Alternatywne serwery CUDA | `vllm` `sglang` | Wspólne API basal nad innym backendem obliczeń. Domyślny kontekst wynosi 4096 tokenów; zmienisz go przez --max-len. |
| basal-omni · obraz i dźwięk | `eager --media on` | NVIDIA GPU, wagi bf16. W tym wydaniu bez trybu fast i portów MLX, FP8 czy GGUF. Media przesyłasz przez HTTP API. |

Tryb NVFP4 na Blackwell jest eksperymentalny i może obniżyć trafność. Pełne wymagania sprzętowe i instalację zależności opisuje dokumentacja projektu.

Uruchomienie tekstowego basal-2.0 na GPU

Przykłady zakładają zainstalowany silnik 2.0, zgodny PyTorch i dostęp do wskazanych wag. Dla modelu 4.5B wyłącz pamięć podręczną szablonu przez --template-prefix off.

```
basal-serve \
  --model Remek/basal-2.0-4.5B \
  --mode fast --template-prefix off \
  --host 127.0.0.1 --port 8000
```

Uruchomienie na Macu z MLX

Wymaga zależności basal[mlx] i portu MLX. Polecenie udostępnia to samo HTTP API na lokalnym porcie.

```
basal-serve \
  --model Remek/basal-2.0-4.5B-MLX-8bit \
  --mode mlx --host 127.0.0.1 --port 8000
```

Uruchomienie basal-omni z obrazem i dźwiękiem

Wymaga zależności basal[media] oraz NVIDIA GPU. Pole media w HTTP API przenosi obrazy i dźwięk. Film trzeba wcześniej rozdzielić na klatki i ścieżkę audio.

```
basal-serve \
  --model Remek/basal-omni-1.0-mini \
  --mode eager --media on \
  --host 127.0.0.1 --port 8000
```

05 / DLA APLIKACJI I WORKFLOW

## Jeden stan. Kilka pytań.

Wyślij JSON do POST /v1/systemone. W n8n wystarczy węzeł HTTP Request; w aplikacji — zwykły klient HTTP albo klient Python basal.

POST /v1/systemoneKopiuj JSON

```
{
  "state": "Przesyłka dotarła uszkodzona. Proszę o wymianę.",
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Który zespół powinien obsłużyć sprawę?",
      "criteria": {
        "claims": "Reklamacje i wymiana towaru",
        "sales": "Pytania przed zakupem",
        "billing": "Faktury i płatności"
      }
    },
    "reply_needed": {
      "type": "noul",
      "instructions": "Czy klient oczekuje odpowiedzi?"
    }
  }
}
```

### Odpowiedź gotowa do użycia w kodzie

W polu answers znajdziesz wynik każdego pytania pod jego nazwą. choice zwraca klucz opcji, noul — prawdopodobieństwo „tak”. Odpowiedź zawiera też model oraz usage z informacją o liczbie pytań, tokenach i czasie obliczenia.

`state`
:   Fakty i zasady potrzebne do decyzji.

`questions`
:   Osobne pytania o wspólny kontekst.

`answers`
:   Typowane wyniki i prawdopodobieństwa.

To definicja zapytania, nie wynik pomiaru. W tej prezentacji nie wywołujemy modelu.

`GET /health` Stan usługi`GET /v1/models` Informacje o załadowanym modelu`POST /v1/basal` Alias API decyzji

06 / MODEL CONTEXT PROTOCOL · EKSPERYMENTALNE

## Agent pyta. basal pomaga wybrać następny krok.

MCP to standard łączenia aplikacji AI z narzędziami. Silnik 2.0 udostępnia własny serwer MCP: agent może poprosić basal o decyzję przez to samo połączenie, przez które korzysta z innych narzędzi.

[Obejrzyj demo MCP w Herdr](https://basal.si5.pl/basal-lab/#mcp-agents) Codex · lokalny basal · Claude Code · film 6:32

1. 01 / AGENT**Zbiera stan i opcje**
2. 02 / BASAL PRZEZ MCP**Zwraca decyzję i pewność**
3. 03 / AGENT LUB APLIKACJA**Wykonuje dozwoloną akcję**

`decide`

### Jedno pytanie

Stan, pytanie i opcje. Obsługuje choice, noul, score oraz multi. Zwraca wynik pytania i nazwę modelu.

`decide_many`

### Kilka pytań o jeden stan

Pełna mapa questions jak w HTTP API. Obsługuje także act z kosztami i max\_error, typ tool oraz facts. Zwraca answers, model i usage.

Oba narzędzia wyłącznie zwracają decyzje. Nie wykonują poleceń, nie uruchamiają innych narzędzi i nie generują ich argumentów. Wykonanie oraz sprawdzenie uprawnień należą do aplikacji korzystającej z MCP.

basal-serve / MCP

```
basal-serve \
  --model Remek/basal-2.0-4.5B \
  --mode fast --template-prefix off \
  --host 127.0.0.1 --port 8000 --mcp on
```

MCP wymaga opcjonalnych zależności basal[mcp]. Domyślnie jest wyłączone. Po włączeniu endpoint /mcp działa przez Streamable HTTP na tym samym porcie i korzysta z tej samej kolejki co /v1/systemone.

Połączenie klienta MCP: HTTP albo stdio

W kliencie obsługującym Streamable HTTP dodaj adres http://127.0.0.1:8000/mcp. Przykład dla Claude Code:

```
claude mcp add --transport http basal http://127.0.0.1:8000/mcp
```

Jeżeli klient uruchamia narzędzia jako lokalne procesy, użyj mostka basal-mcp. Zastąp ścieżkę do programu własną ścieżką bezwzględną:

```
{
  "mcpServers": {
    "basal": {
      "command": "/path/to/basal-env/bin/basal-mcp",
      "args": ["--url", "http://127.0.0.1:8000"]
    }
  }
}
```

Mostek przekazuje zapytania do uruchomionego serwera; nie ładuje drugiej kopii modelu.

Przykład: wybór narzędzia i sprawdzenie brakujących danych

Argumenty wywołania narzędzia decide\_many. Definicje narzędzi są opcjami do wyboru; basal nie uruchamia tu żadnego z nich.

MCP / decide\_manyKopiuj JSON

```
{
  "state": "Klient pyta, gdzie jest zamówienie ZAM-42. Status nie został jeszcze sprawdzony.",
  "questions": {
    "next_step": {
      "type": "tool",
      "instructions": "Które narzędzie jest potrzebne teraz?",
      "tools": [
        {
          "name": "get_order_status",
          "description": "Odczytuje aktualny status zamówienia.",
          "inputSchema": {
            "type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"]
          }
        },
        {
          "name": "list_products",
          "description": "Wyświetla katalog dostępnych produktów.",
          "inputSchema": {"type": "object", "properties": {}}
        }
      ]
    },
    "missing_order_id": {
      "type": "noul",
      "instructions": "Czy brakuje numeru zamówienia?"
    }
  }
}
```

Typ tool zwraca nazwę wybranego narzędzia lub opcję answer\_directly, ask\_user albo none. To agent uzupełnia argumenty i decyduje o wykonaniu zgodnie z uprawnieniami.

**Model na własnym urządzeniu.** Możesz uruchomić basal na HP ZGX Nano i połączyć klientów przez tunel SSH lub własną bramę. Serwer nie ma wbudowanego uwierzytelniania; dostęp z sieci kontrolujesz poza nim. Przetwarzanie w basal pozostaje lokalne, ale agent korzystający z chmurowego LLM może osobno wysyłać do niego swój kontekst.

**Zakres obecnego MCP.** Narzędzia przyjmują stan tekstowy lub JSON. Nie mają parametru media: obrazy i dźwięk dla basal-omni przesyłasz przez HTTP API. MCP i typ tool są eksperymentalne; trafność decyzji sprawdź na własnych zadaniach.

07 / KONTROLA NAD WYKONANIEM

## Ustawienia dopasowane do procesu.

Najważniejsze opcje serwera. Wszystkie flagi i ich wartości sprawdzisz przez basal-serve --help.

| Opcja | Do czego służy |
| --- | --- |
| `--model` / `--mode` | Repozytorium lub lokalny katalog wag oraz backend obliczeń. Każdy proces serwera ładuje wybrany model. |
| `--calibration` | Własny plik kalibracji. Domyślnie serwer wybiera plik dla silnika, jeśli jest dostarczony, albo podstawowy CALIBRATION.json. |
| `--soam on` | Wspólny stan dla wielu pytań i kolejności opcji. Domyślnie włączone; efekty zależą od backendu i zapytania. |
| `--max-batch` `--batch-window-ms` | Łączenie równoległych zapytań w partie. Domyślnie maksymalnie 64, okno pod obciążeniem 3 ms; bez kolejki odpowiedź jest liczona od razu. |
| `--scheduler` | Porządkowanie długich i krótkich zapytań w silniku CUDA. Wyłączenie przywraca obsługę według kolejności nadejścia. |
| `--deterministic` | Powtarzalne odpowiedzi na tej samej maszynie, bez łączenia żądań różnych klientów. Dotyczy silników działających wewnątrz procesu i może zmniejszyć przepustowość. |
| `--context-overflow` | truncate skraca środek zbyt długiego stanu i raportuje to w usage.truncated; refuse odrzuca takie zapytanie. |
| `--template-prefix off` | Zalecane dla basal-2.0 4.5B: pamięć podręczna szablonu nie przeszła testu tego modelu. Mini i max mogą korzystać z ustawienia auto. |
| `--log-decisions` | Zapis prawdopodobieństw w pliku JSONL do analizy działania procesu i późniejszego wykorzystania informacji zwrotnej. |
| `--mcp on` `--media on` | Opcjonalny interfejs dla agentów albo obsługa obrazów i audio w HTTP API basal-omni. Obie funkcje są domyślnie wyłączone i wymagają odpowiednich zależności. |

### Próg jest regułą procesu

max\_error w pytaniach act i tool korzysta z progów pliku kalibracji. Brak odpowiedniego progu oznacza przekazanie decyzji człowiekowi. Cel 5% nie gwarantuje takiego błędu na nowych danych — sprawdź pokrycie i trafność we własnym procesie.

### Kalibracja na Twoich danych

basal-calibrate dopasowuje temperatury i progi na oznaczonych przykładach, z użyciem wybranego silnika. To osobny krok; sam serwer nie uczy się automatycznie z ruchu.

### Eksperymenty mają swój zakres

Tryb --think auto dotyczy tylko basal-2.0 4.5B, wymaga vLLM i jest domyślnie wyłączony. W Werdykcie pogarszał wynik. evidence wymaga osobnej głowicy, której modele basal-2.0 nie dostarczają.

OD INTERFEJSU DO WDROŻENIA

## Podłącz decyzję do swojego procesu.

[Kod i dokumentacja](https://github.com/rkinas/basal) [Poznaj zastosowania ↗](https://basal.si5.pl/zastosowania/)
