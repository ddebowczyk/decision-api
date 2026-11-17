[← Wszystkie wpisy](https://basal.si5.pl/blog/)

Nowe wydanie16 października 20266 min czytania

# basal-omni-1.0-ultra i silnik basal 2.1

Najbardziej zaawansowany model rodziny basal: basal-omni-1.0-ultra (31B) ma 0,879 w Werdykcie, o 5,8 punktu więcej niż Jev 1.14, i jest na równi z Liquid d1-ultra. Silnik basal 2.1 dodaje eksperymentalne zadania classify, verify, compress i extract, a pozostałe odpowiedzi zostawia bez zmian. Do zadań dochodzi eksperymentalny basal-omni-1.1-max.

RKRemigiusz Kinas · ai5

## W tym wpisie

1. [basal-omni-1.0-ultra](https://basal.si5.pl/blog/basal-2-1/#ultra)
2. [Wyniki ultra](https://basal.si5.pl/blog/basal-2-1/#wyniki)
3. [Silnik basal 2.1: zadania](https://basal.si5.pl/blog/basal-2-1/#silnik)
4. [basal-omni-1.1-max](https://basal.si5.pl/blog/basal-2-1/#max-1-1)
5. [Co się nie zmienia](https://basal.si5.pl/blog/basal-2-1/#bez-zmian)
6. [Ograniczenia](https://basal.si5.pl/blog/basal-2-1/#ograniczenia)
7. [Jak zacząć](https://basal.si5.pl/blog/basal-2-1/#start)

basal-omni-1.0-ultra to **najbardziej zaawansowany model rodziny basal**: 31 mld parametrów na Google Gemma 4, to samo API decyzji, tekst i obrazy w jednym zapytaniu. W Werdykcie, naszym ukrytym benchmarku polskich i angielskich decyzji, ma 0,879: więcej niż basal-omni-1.0-max w każdej z 10 kategorii i o 5,8 punktu więcej niż Jev 1.14. Z Liquid d1-ultra jest na równi.

Razem z nim wydajemy **silnik basal 2.1** z czterema eksperymentalnymi zadaniami: `classify`, `verify`, `compress` i `extract`. Wszystkie pozostałe odpowiedzi silnika są takie same jak w 2.0. Do zadań dochodzi eksperymentalny **basal-omni-1.1-max**; domyślnym modelem 12B pozostaje basal-omni-1.0-max.

**0,879**Werdykt v1 dla ultra · PL 0,881 / EN 0,877

**+5,8 pkt**wobec Jev 1.14 (0,822); na równi z Liquid d1-ultra (0,881)

**4 zadania**classify, verify, compress i extract w silniku 2.1

## basal-omni-1.0-ultra

ultra działa jak pozostałe modele basal: czyta stan i odpowiada na typowane pytania, zwracając skalibrowane prawdopodobieństwo każdej dozwolonej odpowiedzi, bez generowania tekstu. Przyjmuje **tekst i obrazy**. Dźwięku nie przyjmuje, bo model bazowy 31B nie ma kodera audio; do nagrań służą basal-omni-1.0-mini i max.

* **Wagi bf16: 59 GB.** Serwer `--mode eager --media on` potrzebuje karty z 80 GB pamięci; na takiej karcie ultra odpowiada na stany do ok. 10 000 tokenów.
* **FP8: 33 GB.** Wersja basal-omni-1.0-ultra-FP8 działa przez `--mode vllm` i czyta tylko tekst. Na pytaniach z 2–10 opcjami wybiera to samo co bf16 w 98,1% decyzji, a trafność różni się o −0,4 punktu (jedno H100).
* **Dostępność.** Wagi: [basal-omni-1.0-ultra](https://huggingface.co/Remek/basal-omni-1.0-ultra) i [basal-omni-1.0-ultra-FP8](https://huggingface.co/Remek/basal-omni-1.0-ultra-FP8) na Hugging Face.

## Wyniki ultra

Werdykt to 5 000 ukrytych decyzji po polsku i angielsku w 10 kategoriach; każdy system dostaje te same pytania. ultra odpowiadał w trybie `--deterministic`, systemy API przez OpenRouter.

Werdykt v1 · średnia z 20 komórek (10 kategorii × 2 języki) · 95% przedział

| System | Werdykt | Polski | Angielski |
| --- | --- | --- | --- |
| basal-omni-1.0-ultra · 31B | 0,879 [0,871–0,887] | 0,881 | 0,877 |
| Liquid d1-ultra · API | 0,881 [0,873–0,890] | 0,879 | 0,883 |
| basal-omni-1.0-max · 12B | 0,823 [0,813–0,832] | 0,824 | 0,821 |
| Jev 1.14 · API | 0,822 [0,811–0,831] | 0,824 | 0,819 |

![Wykres słupkowy Werdyktu v1: basal-omni-1.0-ultra 0,879, Liquid d1-ultra 0,881, Jev 1.14 0,822; ultra i d1-ultra na równi.](/assets/blog/werdykt-ultra-d1-ultra-jev-headline.png?v=1)


Werdykt v1, 5 000 ukrytych decyzji PL + EN; basal-omni-1.0-ultra z silnikiem basal (eager, bf16), d1-ultra i Jev 1.14 przez OpenRouter Decisions API. Różnica między ultra i d1-ultra mieści się w 95% przedziale.

* **Wobec basal-omni-1.0-max:** +5,6 punktu i wyższy wynik w każdej z 10 kategorii, najbardziej w długich dokumentach (0,854 wobec 0,742), zasadach (0,550 wobec 0,418) i kolejnym kroku agenta (0,928 wobec 0,838).
* **Wobec Jev 1.14:** +5,8 punktu (0,879 wobec 0,822).
* **Wobec Liquid d1-ultra: remis statystyczny.** Różnica wynosi −0,2 punktu, a jej 95% przedział (od −1,0 do +0,7) obejmuje zero. ultra prowadzi w 6 kategoriach (najwięcej w umowach: +3,2), d1-ultra w 3 (najwięcej w rozpoznawaniu, że odpowiedzi nie da się ustalić: +7,4), w wyszukiwaniu jest remis.
* **Kalibracja:** błąd kalibracji (ECE) 0,038. Przy celu 1% błędu ultra przyjmuje automatycznie 72,0% decyzji, z obserwowanym błędem 1,37% (d1-ultra na tej samej tablicy: 72,7% przy błędzie 1,25%). d1-ultra jest lepiej skalibrowany (ECE 0,018).
* **Polski egzamin lekarski (LEK), nasz pomiar:** 86,9% po polsku i 87,0% w wersji angielskiej (basal-omni-1.0-max: 75,0% i 80,9%), na tych samych pytaniach i według tego samego protokołu co w [artykule o 2.0](https://basal.si5.pl/blog/basal-2-0/#omni).
* **Wobec MedDecider w LEK:** MedDecider-31B (lion-ai; model medyczny na tej samej bazie Gemma 4 31B, licencja CC BY-NC 4.0), zmierzony przez nas na tych samych pytaniach skryptem jego autorów, ma 87,6% po polsku i 86,9% po angielsku (MedDecider-27B: 86,3% i 86,9%). ultra, który nie jest modelem medycznym, ma −0,7 i +0,1 punktu; jego wynik mieści się w 95% przedziale MedDecider-31B (86,6–88,5% po polsku, 85,7–88,0% po angielsku).

![Trafność w 10 obszarach Werdyktu v1 dla basal-omni-1.0-ultra, Liquid d1-ultra i Jev 1.14: ultra prowadzi w 6 obszarach, d1-ultra w 3, jeden remis. Pod wykresem etykiety typów pytań: wspólne dla trzech systemów (choice, score, noul, wiele pytań o jeden stan, tekst i obrazy), tylko w Jev 1.14 (box) i tylko w basal-omni (multi, act, tool, classify, verify, compress, extract, dźwięk w mini i max).](/assets/blog/werdykt-ultra-d1-ultra-jev-areas.png?v=1)


Trafność w 10 obszarach Werdyktu v1 (5 000 ukrytych decyzji PL + EN); basal-omni-1.0-ultra z silnikiem basal (eager, bf16), d1-ultra i Jev 1.14 przez OpenRouter Decisions API. Etykiety pod wykresem pokazują typy pytań wspólne dla trzech systemów, dostępne tylko w Jev 1.14 i tylko w basal-omni, według dokumentacji TypeSafe, Liquid AI i basal, 16.10.2026.

**Aktualizacja 16.10.** Respan Span-02 (otwarte wagi, Gemma 4 26B-A4B; zmierzony przez hostowany endpoint z rozumowaniem), zmierzony tego samego dnia przez OpenRouter, ma 0,895: 1,6 pkt więcej niż ultra (różnica istotna, 95% przedział +0,6 do +2,6). Przewaga pochodzi głównie z reguł (0,812 wobec 0,550); ultra prowadzi w 7 z 10 obszarów i jest lepiej skalibrowany (ECE 0,038 wobec 0,066; automatyzacja przy 1% 72% wobec 45%). Lokalnie, na otwartych wagach i silniku Respan, Span-02 bez rozumowania (jeden przebieg, jak basal) ma 0,802, a z budżetem 750 ms 0,856; cała przewaga nad ultra pochodzi z rozumowania.

![Wykres słupkowy Werdyktu v1 dla pięciu modeli: Respan Span-02 z rozumowaniem 0,895, Liquid d1-ultra 0,881, basal-omni-1.0-ultra 0,879, Jev 1.14 0,822, Liquid d1 0,808.](/assets/blog/werdykt-five-headline.png?v=1)


Werdykt v1, pięć modeli decyzyjnych na tych samych 5 000 decyzjach PL + EN; ultra z silnikiem basal (eager, bf16), pozostałe przez OpenRouter Decisions API (Span-02 hostowany, z rozumowaniem). Span-02 bez rozumowania, na otwartych wagach i własnym silniku: 0,802.


![Trafność w 10 obszarach Werdyktu v1 dla pięciu modeli. Najlepszy wynik w obszarze: ultra 4, Span-02 3, d1-ultra 3, Jev 1.14 1 (remis w wyszukiwaniu). Span-02 prowadzi w regułach (0,812 wobec 0,550 ultra), ocenach i umowach; ultra w długich dokumentach, ocenianiu odpowiedzi, wyszukiwaniu i kierowaniu spraw.](/assets/blog/werdykt-five-areas.png?v=1)


Trafność w 10 obszarach Werdyktu v1 dla pięciu modeli; pogrubiony najlepszy wynik w obszarze. Przewaga Span-02 pochodzi głównie z reguł, gdzie rozumowanie pomaga najbardziej.

Szybkości ultra jeszcze nie zmierzyliśmy osobnym przebiegiem, dlatego na tablicy Werdyktu czas i koszt ultra są puste. Pełna tabela: [Werdykt](https://basal.si5.pl/benchmark/).

## Silnik basal 2.1: zadania

Silnik v2.1.0 dodaje cztery typy zadań w tym samym API, dla modeli, które już uruchamiasz. Każde zadanie silnik rozkłada na decyzje modelu nad wspólnym stanem, więc model nadal nie pisze tekstu, a każda część odpowiedzi ma prawdopodobieństwo.

* `classify`: etykiety z krótkim opisem każdej; wynik to etykieta i prawdopodobieństwo każdej z nich.
* `verify`: dla każdego twierdzenia: potwierdzone, zaprzeczone albo niewynikające ze stanu.
* `compress`: zdania, wiersze lub akapity potrzebne do pytania, jako krótszy tekst dla innego modelu.
* `extract`: pola schematu JSON skopiowane dokładnie z dokumentu, z pozycją znaków, albo wybrane z listy.

basal-omni-1.0-max w silniku v2.1.0 · testowany na zbiorach testowych (5 publicznych, 1 syntetyczny)

| Zadanie | Zbiór | Pytania | Wynik |
| --- | --- | --- | --- |
| `classify` | CLINC150 „plus”, 151 etykiet z out-of-scope | 1 000 | 85,4% trafności |
| `classify` | BANKING77, 77 etykiet | 1 000 | 74,6% trafności |
| `verify` | VitaminC, trzy odpowiedzi | 1 000 | 80,3% trafności |
| `verify` | RAGTruth, odpowiedź vs źródło | 1 000 | 80,3% trafności |
| `compress` | QASPER, akapity, 30% znaków | 248 | 90,1% potrzebnych akapitów zachowanych |
| `extract` | syntetyczne faktury PL / EN, 12 pól | 400 | 90,1% pól poprawnych |

JSON · CLASSIFY · ODPOWIEDŹ ZMIERZONA

```
{"state": "I was charged twice for my card payment yesterday.",
 "questions": {"intent": {"type": "classify", "none": true, "labels": [
   {"name": "card_payment_duplicate", "rubric": "a card payment was taken more than once"},
   {"name": "card_lost", "rubric": "the card is lost or stolen"},
   {"name": "refund_status", "rubric": "asks about a refund in progress"}]}}}

→ answers.intent (basal-omni-1.0-max, v2.1.0, bf16):
{"label": "card_payment_duplicate", "confidence": 0.9996,
 "scores": {"card_payment_duplicate": 0.9996, "card_lost": 0.0002, "refund_status": 0.0000, "none": 0.0002},
 "automated": {"0.01": null, "0.05": null}}
```

**Pole `automated`** ma wartość tylko z progiem certyfikowanym dla danego zadania w pliku kalibracji. Bez takiego progu jest `null`: progi zwykłych decyzji nie przenoszą się na nowe zestawy etykiet (przy celu 1% od 2 do 9% automatycznych odpowiedzi było błędnych).

**Reszta silnika bez zmian.** Zadania to nowa ścieżka; zwykłe pytania obsługuje ten sam kod co w 2.0. Na basal-omni-1.0-max 23 276 z 23 278 decyzji z testów wydania ma w silniku 2.1 tę samą odpowiedź co w 2.0. Dwie różnice to niemal remisy dwóch opcji. Szczegóły: [zadania na stronie serwera](https://basal.si5.pl/serwer-inferencji/#zadania) i [TASKS.md](https://github.com/rkinas/basal/blob/v2.1.0/docs/TASKS.md).

## basal-omni-1.1-max: eksperymentalny model do zadań

basal-omni-1.1-max to basal-omni-1.0-max po krótkim dodatkowym treningu na formatach zadań. Jest lepszy w zadaniach i nieco słabszy w ogólnych decyzjach, dlatego **domyślnym modelem 12B pozostaje basal-omni-1.0-max**.

* **Zadania:** średnia z sześciu zbiorów z tabeli wyżej rośnie z 83,5 do 85,1. Kontrola nakładania się danych: 27 pytań testowych (12 VitaminC, 15 QASPER) dzieli 13-wyrazowy fragment z danymi treningowymi; bez nich zyski wynoszą +4,2 i +2,7 pkt, a średnia nadal 85,1.
* **Werdykt:** 0,821 wobec 0,823 (w granicach przedziału). Przy celu 1% błędu przyjmuje automatycznie mniej decyzji: 57,7% wobec 60,1%.
* **ContractNLI: −13,7 punktu** (0,583 wobec 0,720; 95% przedział od −19,3 do −7,7). W zwykłych pytaniach o wynikanie 1.1-max zbyt często wybiera „tekst nie mówi tego wystarczająco”. Do takich pytań poza `verify` używaj 1.0-max.
* **Dostępność.** [basal-omni-1.1-max](https://huggingface.co/Remek/basal-omni-1.1-max) na Hugging Face.

## Co się nie zmienia

basal-omni-1.0-mini i basal-omni-1.0-max mają te same wagi co w premierze 14 października; nie wydajemy nowego mini. Modele basal-2.0 również pozostają bez zmian. Silnik 2.1 obsługuje je tak samo jak 2.0.

## Ograniczenia

* **Zadania są eksperymentalne.** Ich API może się zmienić w wersji pośredniej. `extract` nie zwraca jeszcze list obiektów (pozycji faktury) ani pól tekstowych z obrazu.
* **ultra nie słyszy.** Przyjmuje tekst i obrazy; FP8 tylko tekst. Szybkości ultra jeszcze nie zmierzyliśmy osobnym przebiegiem.
* **1.1-max to kompromis.** Zyskuje w zadaniach, traci w ContractNLI i w automatyzacji przy celu 1%.
* **Obliczenia zostaw kodowi.** Reguły, terminy i dokładne progi to najsłabszy punkt decyzji w jednym przebiegu.
* **Zachowaj nadzór nad istotnymi decyzjami.** Decyzje o poważnych skutkach dla ludzi wymagają kontroli człowieka.

## Jak zacząć

TERMINAL · NVIDIA GPU 80 GB · BASAL-OMNI-1.0-ULTRA

```
uv venv --python 3.12 --allow-existing ~/basal-env && source ~/basal-env/bin/activate
uv pip install torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cu128
uv pip install "basal[media] @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"
basal-serve --model Remek/basal-omni-1.0-ultra --mode eager --media on --port 8000
```

TERMINAL · FP8 PRZEZ VLLM · TYLKO TEKST

```
uv pip install vllm==0.31.0 "basal @ https://github.com/rkinas/basal/archive/refs/tags/v2.1.0.tar.gz"
basal-serve --model Remek/basal-omni-1.0-ultra-FP8 --mode vllm --max-len 16384 --gpu-memory 0.9 --port 8000
```

Repozytoria ultra i 1.1-max są publiczne od soboty 17 października. Silnik v2.1.0 jest na GitHubie i działa z każdym modelem omni. Zadania wysyłasz jako POST do `/v1/basal` albo `/v1/systemone`.

[← Wróć do bloga](https://basal.si5.pl/blog/)[Uruchom basal](https://basal.si5.pl/#start)
