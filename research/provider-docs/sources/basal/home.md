NOWE

**Sobota 17.10, 9:00:** basal-omni-1.0-ultra (31B, także FP8) i eksperymentalny basal-omni-1.1-max na Hugging Face. Silnik basal 2.1 już dostępny ([GitHub v2.1.0](https://github.com/rkinas/basal/releases/tag/v2.1.0)). Publikacja na Hugging Face w toku.

**Już dostępne:** [basal-omni-1.0-ultra](https://huggingface.co/Remek/basal-omni-1.0-ultra) (31B, także [FP8](https://huggingface.co/Remek/basal-omni-1.0-ultra-FP8)) i eksperymentalny [basal-omni-1.1-max](https://huggingface.co/Remek/basal-omni-1.1-max) na Hugging Face. Silnik basal 2.1: [GitHub v2.1.0](https://github.com/rkinas/basal/releases/tag/v2.1.0).

[Czytaj o ultra i basal 2.1 →](https://basal.si5.pl/blog/basal-2-1/)

[Artykuł premierowy↗](https://basal.si5.pl/blog/basal-2-1/)

BASAL 2.0 + BASAL-OMNI

# Decyzje z tekstu. Teraz także z obrazu i dźwięku.

**basal-2.0** czyta tekst. **basal-omni** przyjmuje także obrazy i nagrania. Ty opisujesz pytania i dozwolone odpowiedzi. Model wybiera z nich — lokalnie, z informacją o pewności.

[Poznaj obie rodziny](https://basal.si5.pl/#modele) [Porównaj wyniki ↗](https://basal.si5.pl/#werdykt)

🇵🇱 polski · 🇬🇧 angielskiOtwarte wagi · Apache 2.0

OD DANYCH DO DZIAŁANIA lokalnie

Tekstmail · dokument · kontekst

↓

MODELE TEKSTOWE**basal-2.0**

mini (1.5B) - 4.5B - max (11B)

Tekst Obraz Dźwięk

↓

MODELE MULTIMODALNE**basal-omni**

mini (4B) - max (12B)

↓

JEDEN INTERFEJS DECYZJI**Twoje pytania. Konkretne odpowiedzi.**

KategoriaPilnośćNastępna akcja

Modele System-1 · klasyfikator definiowany przy każdym zapytaniu

01 / WYBIERZ SWÓJ MODEL

## Dwie linie. Wspólny język decyzji.

Ta sama idea dynamicznego klasyfikatora. Wybierz modele tekstowe do szybkiej automatyzacji albo multimodalne, gdy odpowiedź jest w obrazie lub nagraniu.

TEKSTGłówne wydanie

### basal-2.0

Szybkie decyzje w Twoim procesie.

Wiadomości, dokumenty, RAG i wybór kolejnego narzędzia agenta. Do 255 opcji w pytaniu, wiele pytań o wspólny kontekst. Polska baza: Bielik.

[**mini**1.5B](https://huggingface.co/Remek/basal-2.0-mini)[**basal-2.0**4.5B](https://huggingface.co/Remek/basal-2.0-4.5B)[**max**11B](https://huggingface.co/Remek/basal-2.0-max)

Wagi na Hugging Face: [kolekcja basal-2.0](https://huggingface.co/collections/Remek/basal-20-6acd1712a8e443c86cd576fc) · bf16, FP8, GGUF, MLX

NVIDIA GPU · Mac / MLX · Ollama / llama.cpp

[Uruchom model tekstowy](https://basal.si5.pl/#start)

TEKST + OBRAZ + DŹWIĘKEksperymentalne

### basal-omni1.0

Decyzja także z tego, co widać i słychać.

Zdjęcie dokumentu, fotografia produktu, nagrana prośba klienta. Przekaż media i zapytaj o ich treść, bez osobnego etapu OCR lub transkrypcji. Baza: Gemma 4.

[**mini · 4B efektywnie (E4B)**basal-omni-1.0-mini](https://huggingface.co/Remek/basal-omni-1.0-mini)[**max · 12B**basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max)**ultra · 31B**od soboty 17.10, 9:00**max 1.1 · zadania**od soboty 17.10, 9:00

Wagi na Hugging Face: [kolekcja basal-omni-1.0](https://huggingface.co/collections/Remek/basal-omni-10-6acea28e8b5baed2db475c1f) · bf16. Nowe od soboty 17.10, 9:00: ultra (31B, także FP8 dla vLLM) i eksperymentalny max 1.1, trenowany na zadaniach silnika 2.1.

NVIDIA GPU · bf16 / eager · ok. 16 GB mini, 24 GB max, GPU 80 GB ultra

[Uruchom model multimodalny](https://basal.si5.pl/#start)

basal-omni to pierwsze wydanie z mediami: obraz i dźwięk korzystają z możliwości modelu bazowego bez dodatkowego treningu multimodalnego. Kalibracja pochodzi z tekstu. ultra czyta tekst i obrazy, bez dźwięku. [Sprawdź wyniki i ograniczenia →](https://basal.si5.pl/benchmark/#multimodalne)

02 / JAK DZIAŁA BASAL

## Klasyfikator zmienia się razem z Twoim pytaniem.

Nie trenujesz osobnego modelu dla każdej listy kategorii. Opisujesz je w zapytaniu. Następne pytanie może już dotyczyć innego procesu.

01

### Przekaż dane

Tekst do basal-2.0. Tekst, obraz lub dźwięk do basal-omni.

„Przesyłka dotarła uszkodzona”

02

### Zadaj pytania

Który zespół? Jak pilne? Jakie tematy? Kilka pytań o jeden kontekst w tym samym wywołaniu.

Sprzedaż · Reklamacje · Logistyka

03

### Wykorzystaj decyzję

Odbierz wynik i prawdopodobieństwa. Aplikacja wykonuje kolejny krok lub kieruje sprawę do człowieka.

Reklamacje → kolejka konsultanta

`choice` jedna opcja`noul` tak / nie`score` ocena`multi` wiele etykiet`act` akcja z kosztami`tool` narzędzie agenta`classify``verify``compress``extract` zadania · basal 2.1[Wszystkie schematy ↗](https://basal.si5.pl/serwer-inferencji/#schematy)

W PRAKTYCE

## Gdzie zastosować basal? Przykłady w skrócie.

Wszędzie tam, gdzie kolejny krok procesu zależy od treści dokumentu, wiadomości lub nagrania. Opisujesz pytanie i dozwolone odpowiedzi, a model zwraca decyzję z poziomem pewności.

[DOKUMENTY / ZAMÓWIENIA

### Kontrola realizacji zamówienia

Zweryfikuj dokumentację zamówienia: przepływ dokumentów i niezgodności kwot. Połącz księgowość, dokumenty produkcyjne i WZ. Model rozpoznaje dokumenty i odczytuje pola, a aplikacja porównuje kwoty i wskazuje rozbieżności do wyjaśnienia.

Zamówienie · WZ · Faktura · Inny dokument**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#omni-documents)
[POCZTA / ZGŁOSZENIA

### Obsługa wiadomości i zgłoszeń

Przypisz wiadomość do zespołu, oceń pilność i rozpoznaj tematy. Kilka pytań o jeden mail w jednym wywołaniu.

Zespół · Pilność 1–5 · Tematy**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#inbox)
[UMOWY / REGUŁY

### Zgodność z zasadami firmy

Sprawdź reklamację, wniosek albo umowę względem reguł opisanych zwykłym językiem, bez trenowania nowego klasyfikatora.

„Czy brakuje protokołu szkody?” → tak / nie**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#claims)
[WIEDZA / RAG

### Odpowiedzi oparte na źródłach

Sprawdź, czy fragmenty z wyszukiwania odpowiadają na pytanie i czy odpowiedź modelu generatywnego ma pokrycie w źródle, zanim zobaczy ją użytkownik.

Ma pokrycie · Częściowo · Brak pokrycia**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#rag)
[AGENCI / AUTOMATYZACJE

### Kolejny krok agenta

Wybierz akcję albo narzędzie z definicji OpenAI lub MCP. Niepewne przypadki skieruj do człowieka.

szukaj\_zamówienia · wyślij\_maila · do człowieka**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#mcp-agents)
[OBRAZ I DŹWIĘK / BASAL-OMNI

### Skany, zdjęcia i nagrania

Zadaj te same pytania do skanu faktury, zdjęcia uszkodzonej przesyłki albo nagrania rozmowy. Wydanie eksperymentalne.

Awaria · Zwrot opłaty · Oddzwonienie**Zobacz w Basal Lab ↗**](https://basal.si5.pl/basal-lab/#omni-calls)

[18 scenariuszy z przykładowymi zapytaniami API ↗](https://basal.si5.pl/zastosowania/)

[![Animowany przewodnik po modelach decyzji typowanych](assets/films/typed-decision-model.jpg?v=6)▶](https://basal.si5.pl/jak-dziala/)

FILM / 14:51 · NAPISY PL / EN

## Inteligentny IF / CASE. Wyjaśniony krok po kroku.

Od jednej wiadomości do decyzji: dynamiczny klasyfikator, prawdopodobieństwa, koszty i sześć typów pytań basal.

[Obejrzyj, jak działa model decyzyjny →](https://basal.si5.pl/jak-dziala/)

[![Film edukacyjny o wszystkich schematach pytań basal](assets/films/basal-schematy.jpg?v=1)▶](https://basal.si5.pl/serwer-inferencji/#film-schematy)

FILM / 15:59 · NAPISY PL / EN

## Wszystkie schematy pytań i zadania basal 2.1. Wyjaśnione krok po kroku.

Każdy typ pytania na pełnym przykładzie JSON: od choice, noul i score przez multi, act i tool po SOAM, kalibrację oraz zadania classify, verify, compress i extract.

[Obejrzyj film o schematach i zadaniach →](https://basal.si5.pl/serwer-inferencji/#film-schematy)

03 / WYNIKI, KTÓRE MOŻESZ SPRAWDZIĆ

## Tekst i multimodalność. Dwa rodzaje pomiaru.

[Pełne wyniki i metodologia](https://basal.si5.pl/benchmark/)

Tekst Werdykt · 5 000 decyzjiObraz i dźwięk basal-omni · 5 prób

### Obie rodziny na tym samym teście tekstowym.

Werdykt to nasz ukryty benchmark: 10 kategorii po polsku i angielsku. Pokazujemy sześć modeli basal oraz punkty odniesienia — model API, otwarty model, Jev 1.14, Liquid d1-ultra i Respan Span-02 w dwóch ustawieniach: z rozumowaniem i bez niego (jeden przebieg, jak basal).

**5 000**decyzji · ten sam protokół

**basal-2.0** stawia na szybkość i wybór sprzętu. **basal-omni** także odpowiada na tekst; jego ultra (31B) ma najwyższą trafność w rodzinie basal.

To wyniki na tekście. Jakość obrazu i dźwięku pokazujemy w drugiej zakładce.

[Zobacz wszystkie systemy ↗](https://basal.si5.pl/benchmark/#werdykt)

PL+ENPolskiAngielski

TRAFNOŚĆ · ŚREDNIA Z 20 KOMÓREKWIĘCEJ = LEPIEJ ↗

Czas i koszt: krótszy pasek = lepiej. Skale od zera do maksimum w tym zestawieniu.

Werdykt PL+EN: basal-omni-max 82,28%, omni-mini 76,88%. basal-2.0: max 78,40%, 4.5B 72,86%, mini 61,84%. [Wyniki i warunki pomiaru →](https://basal.si5.pl/benchmark/)

Werdykt mierzy decyzje tekstowe. Pełne dane i warunki porównania są w benchmarku.

### Co model odczytuje z obrazu i nagrania?

Pięć małych polskich prób, od obrazu dokumentu po intencję rozmówcy. Tutaj wejściem jest rzeczywisty obraz lub dźwięk.

**mini · max · ultra**na tych samych pytaniach; ultra tylko obrazy

Ultra najlepiej odczytuje obrazy, ale nie przyjmuje dźwięku. Max lepiej wypada na obrazach dokumentów niż mini. Mini lepiej odczytuje nagrania. Wielkość modelu nie zastępuje testu konkretnego zadania.

Wydanie eksperymentalne. Mała próba, kalibracja z tekstu. W pełnej tabeli porównasz media z tekstem i modelem bazowym.

[Pełne wyniki multimodalne ↗](https://basal.si5.pl/benchmark/#multimodalne)

omni-mini · 4B omni-max · 12B omni-ultra · 31B

Trafność z mediów · skala 0–100% · więcej = lepiej

Wyniki pięciu prób znajdziesz w [tabeli multimodalnej →](https://basal.si5.pl/benchmark/#multimodalne).

omni-probe-pl · 160 + 150 pytań o obrazy, 140 + 100 + 45 o nagrania. To osobne próby, a nie wynik w Werdykcie.

04 / ZOBACZ, CO MOŻESZ ZBUDOWAĆ

## Od danych do działania.

[Wszystkie filmy w Basal Lab ↗](https://basal.si5.pl/basal-lab/)

[![Demonstracja dynamicznego klasyfikatora w procesie B2B](assets/lab/dynamic-classifier.jpg)

TEKST / PROCES B2B

### Jeden model. Kolejne decyzje.

Poprzednia odpowiedź zmienia pytanie, typ operacji i listę kolejnych opcji.

**Zobacz, jak działa ↗**](https://basal.si5.pl/basal-lab/#dynamic-classifier)
[![Demonstracja decyzji z obrazów dokumentów](assets/lab/omni-documents.jpg)

OBRAZ / DOKUMENTY

### Zapytaj o to, co na skanie.

Obraz dokumentu trafia do modelu. Pytania zamieniają jego treść w decyzje.

**Obejrzyj analizę dokumentów ↗**](https://basal.si5.pl/basal-lab/#omni-documents)
[![Demonstracja analizy polskich rozmów](assets/lab/omni-calls.jpg)

DŹWIĘK / OBSŁUGA KLIENTA

### Usłysz intencję klienta.

Nagranie, pytania o sens rozmowy i wybrana ścieżka dalszej obsługi.

**Posłuchaj i zobacz wynik ↗**](https://basal.si5.pl/basal-lab/#omni-calls)

[**Nowe: Codex + basal + Claude Code przez MCP**Trzy panele Herdr. Rzeczywiste decyzje. Kontrola kosztu przed działaniem.Obejrzyj film →](https://basal.si5.pl/basal-lab/#mcp-agents)

Nagrania pokazują wcześniejsze wersje modeli; wersję i rzeczywiste pomiary podajemy przy każdym przypadku. [Otwórz katalog zastosowań →](https://basal.si5.pl/zastosowania/)

05 / ZACZNIJ BUDOWAĆ

## Jeden silnik. Dwie rodziny modeli.

Uruchom basal-2.0 do tekstu albo basal-omni do obrazów i dźwięku. Oba przyjmują pytania przez `POST /v1/systemone`. Zmieniasz model, zachowujesz sposób integracji.

Python, TypeScript lub zwykły HTTP n8n i własne aplikacje Obliczenia i dane na Twoim sprzęcie

Silnik basal 2.1 (v2.1.0) jest dostępny. basal-omni-1.0-ultra i basal-omni-1.1-max: sobota, 17 października, 9:00 (Warszawa).

[Pełna dokumentacja](https://github.com/rkinas/basal#quick-start)

Tekst · GPU
Apple Silicon
Ollama
Python
TypeScript
cURL
Omni · media
Zadania · 2.1

Kopiuj

```
# 1. Utwórz środowisko (wymaga uv)
uv venv --python 3.12 --allow-existing ~/basal-env
source ~/basal-env/bin/activate

# 2. Zainstaluj PyTorch i silnik
uv pip install torch==2.11.0 \
  --index-url https://download.pytorch.org/whl/cu128
uv pip install "basal[fp8] @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"

# 3. Uruchom model (bf16; port FP8: Remek/basal-2.0-4.5B-FP8 --mode fp8)
basal-serve --model Remek/basal-2.0-4.5B \
  --mode fast --template-prefix off --port 8000
```

TERMINAL · LINUX / WSL + NVIDIA GPUv2.1.0

Zainstaluj
[uv](https://docs.astral.sh/uv/getting-started/installation/)
i sterownik obsługujący CUDA 12.8 (B300 i HP ZGX Nano (Nvidia DGX Spark): cu130).
Pierwszy start kompiluje model przez kilka minut. Wszystkie karty:
[instrukcja sprzętowa](https://github.com/rkinas/basal/blob/main/docs/HARDWARE.md).

WARTO WIEDZIEĆ

## Który basal do Twojego projektu?

Tekstowy czy multimodalny?

basal-2.0 wybierz do szybkich decyzji na tekście, na GPU, Macu lub przez Ollama. basal-omni wybierz, gdy wejściem jest obraz albo nagranie. Omni odpowiada też na pytania tekstowe, ale działa obecnie tylko na GPU NVIDIA w trybie eager.

Czy model generuje odpowiedź jak chatbot?

Standardowo zwraca typowaną decyzję i prawdopodobieństwa dozwolonych odpowiedzi. Do napisania maila lub streszczenia użyj modelu generatywnego; basal może wybrać ścieżkę, ocenić dane albo sprawdzić wynik. Eksperymentalny tryb myślenia basal-2.0 4.5B opisujemy w artykule o wydaniu.

Co nowego w basal 2.1?

Silnik v2.1.0 dodaje cztery eksperymentalne zadania w tym samym API: classify (etykiety z opisem), verify (czy twierdzenia wynikają z tekstu), compress (fragmenty potrzebne do pytania) i extract (pola schematu JSON skopiowane dokładnie z dokumentu). Model nie pisze tekstu: zadanie składa się z jego decyzji. W sobotę 17 października dochodzą basal-omni-1.0-ultra (31B) i eksperymentalny basal-omni-1.1-max do zadań. [Zobacz zadania →](https://basal.si5.pl/serwer-inferencji/#zadania)

Jakie media obsługuje basal-omni?

Obrazy i nagrania dźwiękowe do 30 sekund, także obok tekstu w jednym zapytaniu (ultra: tylko obrazy). Ten release nie przyjmuje pliku wideo bezpośrednio. W aplikacji możesz wcześniej wyodrębnić klatki filmu i ścieżkę audio.

Czy dane muszą opuścić firmę?

Nie. Po pobraniu wag uruchamiasz model na własnym sprzęcie i sam kontrolujesz aplikację oraz jej połączenia. Do samej inferencji nie jest potrzebne zewnętrzne API.

Co oznacza poziom pewności?

To skalibrowana ocena modelu, a nie gwarancja poprawności. Próg dobierz na przykładach ze swojego procesu. basal-omni korzysta z kalibracji dopasowanej na tekście; wymaga osobnego sprawdzenia na obrazach i nagraniach. [Poznaj pomiary kalibracji →](https://basal.si5.pl/benchmark/#pewnosc)

PREMIERA / ŚRODA, 14 PAŹDZIERNIKA

## Poznaj całe wydanie.

basal-2.0 i basal-omni: modele, wyniki, kalibracja oraz konkretne przykłady API. Wszystkie szczegóły w jednym artykule.

[Czytaj o basal 2.0 i omni](https://basal.si5.pl/blog/basal-2-0/)

Budujesz z basal? [Dodaj swoje zastosowanie ↗](https://basal.si5.pl/uzywam/)

[Zobacz, kto używa basal →](https://basal.si5.pl/kto-uzywa/)
