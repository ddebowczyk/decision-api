BENCHMARK / 16.10.2026

# Tekst. Obraz. Dźwięk. Wyniki, które możesz sprawdzić.

**basal-2.0 i basal-omni** porównujemy w tekstowym Werdykcie. Obrazy i nagrania sprawdzamy osobno w polskiej próbie multimodalnej. Wybierz rodzaj testu, aby zobaczyć wyniki, warunki pomiaru i ograniczenia.

Jak wybraliśmy modele do porównania?

Modele decyzyjne wybraliśmy wstępnie z czołówki rankingu [Benchmark Heaven (JevBench)](https://benchmarkheaven.com/jev-models). Wybraną grupę poddajemy wspólnej weryfikacji w autorskim Werdykcie, na tych samych pytaniach. Pokazujemy także rodzinę basal, duże modele API i pomiary kontrolne. Wcześniejsze wydania zostają w tabeli jako punkty odniesienia.

**5 000**decyzji w Werdykcie

**10 × 2**kategorii × języki

**102**systemów w pełnej tabeli

**5 prób**obraz i dźwięk · basal-omni

[Werdykt Tekst · PL + EN](https://basal.si5.pl/benchmark/#werdykt)
[Obraz i dźwięk basal-omni · 5 prób](https://basal.si5.pl/benchmark/#multimodalne)
[Tylko po polsku Polish items only](https://basal.si5.pl/benchmark/#polski)
[Polski: kategorie Category by category](https://basal.si5.pl/benchmark/#kategorie)
[Postęp rodziny 1.0 → 1.5 → 2.0](https://basal.si5.pl/benchmark/#rodzina)
[Próg pewności Kalibracja i automatyzacja](https://basal.si5.pl/benchmark/#pewnosc)

01 / PEŁNE PORÓWNANIE

## Werdykt v1

[Pobierz wyniki JSON ↓](https://basal.si5.pl/assets/benchmarks/werdykt-v1.json)

Werdykt to autorski benchmark projektu basal. Podajemy średnią trafność z 20 grup: 10 kategorii w dwóch językach. Wszystkie modele, także basal-omni, otrzymują tutaj wyłącznie tekst. Tabela obejmuje ukończone przebiegi pełnego testu. basal-2.0 działa w trybie fast (bf16), a basal-omni w trybie eager (bf16). Wyniki mediów znajdziesz w zakładce „Obraz i dźwięk”.

Pomiary silnika: [Konfiguracje basal-2.0 i basal-omni na H100 ↓](https://basal.si5.pl/benchmark/#konfiguracje-basal)

Pokaż:Wszystkie systemybasal-2.0 · tekstbasal-omni · mini, max, ultra

Znajdź model

Rodzaj systemu

Wszystkie
Otwarte wagi
API

Wielkość modelu

Wszystkie
do 2 mld
3–5 mld
7–14 mld
15–40 mld
nieznana

Architektura

Wszystkie
gęste
MoE

WynikPL + EN · ogółemPolski · ogółemAngielski · ogółemPL + EN · Brak wystarczających danychPL + EN · Następny krok agentaPL + EN · UmowyPL + EN · Ocena odpowiedziPL + EN · Długie dokumentyPL + EN · Rzeczywiste dokumentyPL + EN · Wyszukiwanie i RAGPL + EN · Kierowanie zgłoszeńPL + EN · Reguły i terminyPL + EN · Ocena na skali

Sortuj wedługTrafność: malejącoCzas p50: rosnącoKoszt: rosnąco

Wielkość liczymy we wszystkich parametrach modelu: modele MoE (np. 26B-A4B, 35B-A3B) są w klasie 15–40 mld, a liczbę aktywnych parametrów pokazujemy w tabeli. Systemy API i modele bez podanego rozmiaru mają klasę „nieznana”.

102 systemów · tabela przewija się poziomo na mniejszych ekranach.

Werdykt v1 · 5 000 decyzji · eksport z 16 października 2026

| Miejsce · model / parametry | PL + EN | 95% przedział PL + EN | Polski | Angielski | Czas p50 ms ↓ | Czas p95 ms ↓ | USD / 1000 decyzji ↓ | Silnik / rozumowanie |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Gemini 3.8 Flash— · API | 99,56% | 99,38%–99,72% | 99,56% | 99,56% | 3 314,5 | 7 379,4 | 2,5297 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 2 Claude Opus 5.5†— · API | 99,40% | 99,18%–99,62% | 99,20% | 99,60% | 5 531,3 | 9 362,2 | 15,1738 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 3 GPT-6.1 Sol— · API | 99,38% | 99,16%–99,60% | 99,24% | 99,52% | 2 213,6 | 4 928,0 | 3,1780 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 4 GPT-6 Astra†— · API | 99,34% | 99,12%–99,56% | 99,20% | 99,48% | 1 993,9 | 4 356,5 | 15,8178 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 5 GPT-6 Luna— · API | 98,32% | 97,94%–98,64% | 97,84% | 98,80% | 2 380,1 | 4 210,5 | 0,1880 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 6 Gemini 3.1 Pro (preview)†— · API5 nieodczytanych odpowiedzi / 5 000 | 97,88% | 97,48%–98,24% | 97,92% | 97,84% | 5 539,5 | 19 820,1 | 12,2981 | APIAPI dostawcyRozumowanie: Domyślne dostawcy |
| 7 Respan Span-02 · endpoint z rozumowaniem\*¹26B / 4B aktywnych · otwarte wagi | 89,52% | 88,72%–90,28% | 89,80% | 89,24% | 239,2 | 2 846,3 | 0,0133 | endpoint Respan · rozumowanie dostawcyHostowany endpoint dostawcyRozumowanie: Domyślne dostawcy |
| 8 Liquid d1-ultra¹nie podano · API | 88,10% | 87,26%–88,96% | 87,88% | 88,32% | 256,1 | 400,5 | 0,0523 | APIAPI dostawcy |
| 9 basal-omni-1.0-ultra¹31B · otwarte wagi | 87,92% | 87,06%–88,74% | 88,12% | 87,72% | — | — | — | basal-serve · eager1 × H200 141 GB |
| 10 Respan Span-02 · 750 ms¹26B / 4B aktywnych · otwarte wagi | 85,58% | 84,60%–86,50% | 84,84% | 86,32% | 34,0 | 694,2 | 0,1116 | silnik Respan · budżet 750 ms (auto)1 × RTX PRO 6000 Blackwell 96 GB |
| 11 René-1 31B FP8¹31B · otwarte wagi | 85,36% | 84,48%–86,28% | 85,00% | 85,72% | 139,8 | 1 849,2 | 0,3902 | Serwer modelu1 × H100 80 GB |
| 12 pplx-decider-v1.1-27b (Decisions API)¹27B · API | 85,18% | 84,26%–86,08% | 85,04% | 85,32% | 263,5 | 599,4 | 0,0266 | APIAPI dostawcy |
| 13 Mercury Decide (OpenRouter Decisions API)¹nie podano · API | 84,48% | 83,56%–85,32% | 84,48% | 84,48% | 420,4 | 1 021,4 | 0,0260 | APIAPI dostawcy |
| 14 deck-31B¹31B · otwarte wagi | 83,54% | 82,54%–84,46% | 83,44% | 83,64% | 1 260,5 | 2 555,1 | 1,5840 | Serwer modelu1 × H100 80 GB |
| 15 decisio v0.8.0 on gemma-4-31B-it¹31B · otwarte wagi | 83,48% | 82,52%–84,38% | 83,36% | 83,60% | 64,9 | 499,6 | 0,1207 | Serwer modelu1 × H100 80 GB |
| 16 Quyet-1.0-Large¹31.3B (30.7B text) · otwarte wagi29 błędów wywołania / 5 000 | 83,28% | 82,30%–84,20% | 82,80% | 83,76% | 149,0 | 1 333,2 | 0,3093 | Serwer modelu1 × H100 80 GB |
| 17 Decider chat · Gemma-4-31B¹31B · otwarte wagi | 82,46% | 81,54%–83,40% | 82,48% | 82,44% | 145,6 | 3 406,2 | 0,3003 | Serwer modelu1 × RTX PRO 6000 Blackwell 96 GB |
| 18 basal-omni-1.0-max¹12B · otwarte wagi | 82,28% | 81,34%–83,24% | 82,44% | 82,12% | 76,2 | 1 359,6 | 0,2631 | basal-serve · eager1 × H100 80 GB |
| 19 Jev 1.14¹nie podano · API | 82,16% | 81,14%–83,10% | 82,40% | 81,92% | 267,6 | 407,4 | 0,0710 | APIAPI dostawcy |
| 20 Eikos-27B-FP8 (v1.3)†¹27B · otwarte wagi | 82,12% | 81,14%–83,10% | 81,92% | 82,32% | 115,8 | 522,9 | 0,0902 | Serwer modelu1 × H100 80 GB |
| 21 basal-omni-1.1-max¹12B · otwarte wagi | 82,06% | 81,12%–83,00% | 81,88% | 82,24% | 85,5 | 1 398,2 | 0,2662 | basal-serve 2.1 · eager1 × H100 80 GB |
| 22 Jebadiah 27B†¹27B · otwarte wagi | 81,96% | 81,02%–82,92% | 82,32% | 81,60% | 96,7 | 843,9 | 0,1970 | Serwer modelu1 × H100 80 GB |
| 23 pplx-decider-v1-27b†¹27B · otwarte wagi112 błędów wywołania / 5 000 | 81,80% | 80,84%–82,70% | 81,84% | 81,76% | 93,0 | 671,8 | 0,1689 | Serwer modelu1 × H100 80 GB |
| 24 Surogate Rune 26B-A4B v3¹26B / 4B aktywnych · otwarte wagi | 81,68% | 80,66%–82,64% | 80,88% | 82,48% | 164,1 | 1 509,9 | 0,1533 | surogate · C++1 × RTX PRO 6000 Blackwell 96 GB |
| 25 Jev 1.13.0— · API | 81,64% | 80,70%–82,58% | 82,04% | 81,24% | 286,4 | 378,8 | 0,0710 | APIAPI dostawcy |
| 26 Respan Span-02 · 300 ms¹26B / 4B aktywnych · otwarte wagi | 81,38% | 80,34%–82,38% | 80,60% | 82,16% | 34,0 | 291,1 | 0,0584 | silnik Respan · budżet 300 ms1 × RTX PRO 6000 Blackwell 96 GB |
| 27 Solar Decide¹— · API | 81,32% | 80,32%–82,28% | 78,52% | 84,12% | 1 271,7 | 28 248,0 | 0,0916 | APIAPI dostawcy |
| 28 Liquid d1¹— · API | 80,78% | 79,82%–81,76% | 80,52% | 81,04% | 329,0 | 491,5 | 0,0498 | APIAPI dostawcy |
| 29 Clef (OpenRouter Decisions API)¹27B · API | 80,76% | 79,78%–81,72% | 81,28% | 80,24% | 377,1 | 1 199,2 | 0,3345 | APIAPI dostawcy |
| 30 Respan Span-02 · bez rozumowania¹26B / 4B aktywnych · otwarte wagi | 80,24% | 79,24%–81,24% | 79,40% | 81,08% | 30,7 | 196,3 | 0,0282 | silnik Respan · bez rozumowania1 × RTX PRO 6000 Blackwell 96 GB |
| 31 Bobcat Flash 1.2¹26B / 4B aktywnych · otwarte wagi | 80,22% | 79,16%–81,22% | 80,04% | 80,40% | 38,4 | 206,9 | 0,0319 | Serwer modelu1 × H100 80 GB |
| 32 simple-jev · Qwen3.8-27B (featherless)†¹27B · otwarte wagi | 80,14% | 79,14%–81,08% | 80,00% | 80,28% | 277,3 | 1 024,2 | 0,4017 | Serwer modelu1 × H100 80 GB |
| 33 Microsoft-Decision-1 (OpenRouter Decisions API)¹nie podano · API | 80,02% | 79,04%–81,02% | 79,04% | 81,00% | 331,7 | 414,7 | 0,0537 | APIAPI dostawcy |
| 34 Xor 26B-A4B 1.0¹26B / 4B aktywnych · otwarte wagi | 79,76% | 78,72%–80,74% | 79,48% | 80,04% | 95,9 | 280,0 | 0,0396 | Serwer modelu1 × H100 80 GB |
| 35 Reflex 27B (Decision Index 0.2 build)†¹27B · otwarte wagi | 79,10% | 78,04%–80,06% | 79,52% | 78,68% | 135,4 | 500,7 | 0,1133 | Serwer modelu1 × H100 80 GB |
| 36 decider-12b v212B · otwarte wagi | 78,90% | 77,94%–79,94% | 79,12% | 78,68% | 48,9 | 975,1 | 0,1588 | Serwer modelu1 × H100 80 GB |
| 37 Cygnet¹12B · otwarte wagi | 78,52% | 77,52%–79,54% | 79,04% | 78,00% | 39,6 | 276,9 | 0,0522 | Serwer modelu1 × H100 80 GB |
| 38 Winnow-12B (Q8)¹12B · otwarte wagi | 78,50% | 77,42%–79,44% | 78,56% | 78,44% | 126,2 | 1 096,7 | 0,2599 | Serwer modelu1 × H100 80 GB |
| 39 basal-2.0-max¹11B · otwarte wagi | 78,40% | 77,36%–79,46% | 78,68% | 78,12% | 37,4 | 344,3 | 0,0678 | basal v2.0.0 · fast1 × H100 80 GB |
| 40 GPT-6 Luna Decisions¹— · API | 78,38% | 77,36%–79,38% | 79,24% | 77,52% | 438,0 | 623,3 | 0,1304 | APIAPI dostawcy |
| 41 JEVfire (Qwen3.8-27B-FP8)†¹27B · otwarte wagi | 77,74% | 76,74%–78,70% | 77,84% | 77,64% | 93,6 | 526,4 | 0,1020 | Serwer modelu1 × H100 80 GB |
| 42 basal-1.5-max¹11B · otwarte wagi | 77,28% | 76,24%–78,28% | 77,68% | 76,88% | 67,1 | 476,6 | 0,1081 | SGLang1 × H100 80 GB |
| 43 Xor 1.2¹35B / 3B aktywnych · otwarte wagi | 77,22% | 76,16%–78,20% | 77,08% | 77,36% | 145,9 | 370,0 | 0,0356 | Serwer modelu1 × RTX PRO 6000 Blackwell 96 GB |
| 44 decider-12b v112B · otwarte wagi | 77,10% | 76,10%–78,14% | 76,88% | 77,32% | 47,6 | 977,7 | 0,1594 | Serwer modelu1 × H100 80 GB |
| 45 basal-omni-1.0-mini¹4B · otwarte wagi | 76,88% | 75,84%–77,84% | 77,48% | 76,28% | 66,6 | 675,1 | 0,1263 | basal-serve · eager1 × H100 80 GB |
| 46 Decider chat · Qwen3.6-27B¹27B · otwarte wagi | 76,86% | 75,76%–77,88% | 76,84% | 76,88% | 90,7 | 1 165,9 | 0,2352 | Serwer modelu1 × H100 80 GB |
| 47 Jev-Omni¹12B · otwarte wagi | 75,34% | 74,22%–76,38% | 76,32% | 74,36% | 1 131,5 | 1 555,0 | 1,2397 | Serwer modelu1 × H100 80 GB |
| 48 H2O-Lightning-4B v1.1¹4B · otwarte wagi | 75,30% | 74,20%–76,44% | 74,52% | 76,08% | 58,6 | 127,6 | 0,0206 | Serwer modelu1 × H100 80 GB |
| 49 JPT-9B¹9B · otwarte wagi | 75,18% | 74,08%–76,24% | 74,12% | 76,24% | 159,5 | 339,2 | 0,0545 | Serwer modelu1 × H100 80 GB |
| 50 Decision 1.0 Lux 9B¹9B · otwarte wagi | 74,94% | 73,80%–76,06% | 73,84% | 76,04% | 56,6 | 325,9 | 0,0882 | Serwer modelu1 × H100 80 GB |
| 51 DREX v1.5 (OpenRouter Decisions API)¹nie podano · API | 74,88% | 73,70%–75,96% | 73,60% | 76,16% | 310,8 | 641,1 | 0,0505 | APIAPI dostawcy |
| 52 MedDecider-9B¹9.7B · otwarte wagi | 73,28% | 72,18%–74,44% | 72,08% | 74,48% | 151,0 | 545,7 | 0,2105 | Serwer modelu1 × H100 80 GB |
| 53 basal-2.0¹4.5B · otwarte wagi | 72,86% | 71,70%–73,92% | 72,88% | 72,84% | 25,0 | 188,1 | 0,0341 | basal v2.0.0 · fast1 × H100 80 GB |
| 54 basal-1.5¹4.5B · otwarte wagi | 72,12% | 71,02%–73,26% | 72,44% | 71,80% | 33,8 | 270,2 | 0,0477 | SGLang1 × H100 80 GB |
| 55 Decision-2.0-Nox-4B¹4B (4.21B) · otwarte wagi | 71,64% | 70,46%–72,80% | 70,92% | 72,36% | 863,8 | 1 302,4 | 1,0093 | eager · H100 NVL1 × H100 NVL 94 GB |
| 56 Clef Flash (OpenRouter Decisions API)¹9B · API | 71,60% | 70,44%–72,74% | 70,12% | 73,08% | 345,8 | 700,5 | 0,1254 | APIAPI dostawcy |
| 57 Clef-Flash¹9B · otwarte wagi | 71,58% | 70,40%–72,70% | 70,08% | 73,08% | 1 700,2 | 1 857,0 | 1,8990 | Serwer modelu1 × H100 80 GB |
| 58 JPT-4B¹4B · otwarte wagi | 71,14% | 69,98%–72,34% | 70,12% | 72,16% | 69,5 | 193,0 | 0,0412 | Serwer modelu1 × H100 80 GB |
| 59 Hopper (G) 1.2¹4B · otwarte wagi | 71,10% | 69,96%–72,20% | 70,68% | 71,52% | 59,5 | 169,0 | 0,0694 | Serwer modelu1 × H100 80 GB |
| 60 sonda-1.0-4B¹4B · otwarte wagi113 błędów wywołania / 5 000 | 70,72% | 69,60%–71,90% | 69,92% | 71,52% | 51,4 | 181,6 | 0,0359 | vLLM1 × H100 NVL 94 GB |
| 61 Qwen3-32B, zero-shot (jqv)¹32B · otwarte wagi | 70,54% | 69,42%–71,68% | 69,52% | 71,56% | 129,5 | 910,7 | 0,2298 | Serwer modelu1 × H100 80 GB |
| 62 decider-35b-a3b NVFP4¹35B / 3B aktywnych · otwarte wagi | 70,38% | 69,26%–71,54% | 70,20% | 70,56% | 48,0 | 190,7 | 0,0173 | Serwer modelu1 × RTX PRO 6000 Blackwell 96 GB |
| 63 Hopper4B · otwarte wagi | 70,28% | 69,16%–71,42% | 69,40% | 71,16% | 60,4 | 165,4 | 0,1376 | Serwer modelu1 × H100 80 GB |
| 64 Decision 4B v1.2¹4B · otwarte wagi | 70,16% | 69,08%–71,34% | 69,84% | 70,48% | 28,7 | 206,9 | 0,0710 | Serwer modelu1 × H100 80 GB |
| 65 Clef Omni (OpenRouter Decisions API)¹nie podano · API | 70,14% | 68,90%–71,22% | 69,12% | 71,16% | 182,3 | 318,8 | 0,2210 | APIAPI dostawcy |
| 66 decider-4b v2¹4B · otwarte wagi | 70,00% | 68,86%–71,14% | 69,68% | 70,32% | 27,8 | 283,3 | 0,0515 | Serwer modelu1 × H100 80 GB |
| 67 djev¹26B / 4B aktywnych · otwarte wagi274 błędów wywołania / 5 000 | 69,80% | 68,72%–70,98% | 70,16% | 69,44% | 66,6 | 159,1 | 0,0526 | Serwer modelu1 × H100 80 GB |
| 68 spark-s1-4b-v6¹4B · otwarte wagi | 69,38% | 68,16%–70,58% | 68,84% | 69,92% | 217,4 | 565,2 | 0,2879 | open\_spark\_jev · HF1 × H100 80 GB |
| 69 Plumb-4B¹4B · otwarte wagi | 69,04% | 67,88%–70,32% | 68,92% | 69,16% | 27,7 | 245,7 | 0,0553 | Serwer modelu1 × H100 80 GB |
| 70 Decision 4B v1.1¹4B · otwarte wagi | 69,02% | 67,88%–70,22% | 68,76% | 69,28% | 28,5 | 207,1 | 0,1236 | Serwer modelu1 × H100 80 GB |
| 71 MedDecider-4B¹4.7B · otwarte wagi | 68,90% | 67,80%–70,18% | 68,44% | 69,36% | 151,1 | 418,4 | 0,1939 | Serwer modelu1 × H100 80 GB |
| 72 JevK5 v0.3¹4B · otwarte wagi | 68,86% | 67,68%–70,12% | 68,28% | 69,44% | 28,4 | 258,5 | 0,0570 | Serwer modelu1 × H100 80 GB |
| 73 Tev1 4B Experimental¹4B · API | 68,62% | 67,46%–69,78% | 68,04% | 69,20% | 239,6 | 350,2 | 0,0569 | APIAPI dostawcy |
| 74 Kev 1.0 (kev-4b)¹4B · otwarte wagi | 68,36% | 67,14%–69,64% | 67,16% | 69,56% | 34,1 | 308,9 | 0,0442 | kev.serve1 × H100 80 GB |
| 75 Imajev-4B¹4B · otwarte wagi436 błędów wywołania / 5 000 | 68,16% | 67,10%–69,24% | 66,56% | 69,76% | 112,7 | 132,3 | 0,1349 | Serwer modelu1 × H100 80 GB |
| 76 Kev 4B (OpenRouter Decisions API)¹4B · API108 błędów wywołania / 5 000 | 67,44% | 66,24%–68,72% | 66,00% | 68,88% | 878,8 | 1 362,7 | 0,0442 | APIAPI dostawcy |
| 77 Jet v6.2¹4B · otwarte wagi | 67,34% | 66,12%–68,50% | 66,76% | 67,92% | 934,5 | 1 063,7 | 0,3490 | Serwer modelu1 × H100 80 GB |
| 78 JevK5 v0.2 (4B)¹4B · otwarte wagi | 66,72% | 65,56%–67,94% | 66,40% | 67,04% | 30,7 | 240,4 | 0,0562 | jevk5-serve1 × H100 80 GB |
| 79 basal-1.0 · 4.5B4.5B · otwarte wagi | 66,04% | 64,70%–67,18% | 66,20% | 65,88% | 26,5 | 779,5 | 0,1353 | basal · fast1 × H100 80 GB |
| 80 sonda-1.1-4B¹4B · otwarte wagi | 64,02% | 62,80%–65,26% | 63,92% | 64,12% | 67,2 | 136,6 | 0,0252 | Serwer modelu1 × H100 80 GB |
| 81 Malkuth-4B¹4B · otwarte wagi108 błędów wywołania / 5 000 | 63,36% | 62,10%–64,66% | 62,24% | 64,48% | 153,2 | 285,2 | 0,1722 | Serwer modelu1 × H100 80 GB |
| 82 Manchego v2.14B · otwarte wagi | 63,04% | 61,76%–64,30% | 62,20% | 63,88% | 73,5 | 400,8 | 0,1149 | Serwer modelu1 × H100 80 GB |
| 83 local-jev (Qwen3.5-4B)¹4B · otwarte wagi | 62,98% | 61,76%–64,16% | 62,48% | 63,48% | 142,7 | 535,8 | 0,2534 | local-jev · HF1 × H100 80 GB |
| 84 typecastlm v1.3.0 (Qwen3.5 3.8B)¹3.8B · otwarte wagi | 62,88% | 61,72%–64,14% | 62,36% | 63,40% | 95,2 | 217,3 | 0,1381 | typecastlm · local1 × H100 80 GB |
| 85 lev4B · otwarte wagi | 62,86% | 61,64%–64,12% | 61,68% | 64,04% | 157,6 | 538,1 | 0,2013 | Serwer modelu1 × H100 80 GB |
| 86 jev-local (Qwen3.5-9B, HF scorer)¹9B · otwarte wagi436 błędów wywołania / 5 000 | 62,18% | 61,08%–63,32% | 61,56% | 62,80% | 460,7 | 829,0 | 2,0440 | jevlocal · HF scorer1 × H100 80 GB |
| 87 Qwen3-4B-Instruct-2507 (raw, letter logits)¹4B · otwarte wagi · pomiar kontrolny | 62,08% | 60,90%–63,22% | 61,40% | 62,76% | 40,0 | 161,2 | 0,0222 | vLLM · logity liter1 × H100 80 GB |
| 88 basal-2.0-mini¹1.5B · otwarte wagi | 61,84% | 60,54%–63,08% | 62,76% | 60,92% | 15,5 | 93,9 | 0,0103 | basal v2.0.0 · fast1 × H100 80 GB |
| 89 metask-jev-4b¹4B · otwarte wagi441 błędów wywołania / 5 000 | 61,16% | 59,90%–62,34% | 60,68% | 61,64% | 107,8 | 177,1 | 0,3400 | Serwer modelu1 × H100 80 GB |
| 90 basal-1.5-mini1.5B · otwarte wagi | 60,66% | 59,40%–61,92% | 61,92% | 59,40% | 14,2 | 346,4 | 0,0535 | basal · fast1 × H100 80 GB |
| 91 open-alternative-jev (so1, Qwen3.5-4B)¹4B · otwarte wagi | 60,24% | 58,94%–61,50% | 59,16% | 61,32% | 101,4 | 433,4 | 0,1579 | so1 · HF + adapter HTTP1 × H100 80 GB |
| 92 Solar Decide Flash¹— · API | 60,16% | 58,92%–61,42% | 57,12% | 63,20% | 940,7 | 1 684,6 | 0,0916 | APIAPI dostawcy |
| 93 SemIf¹4B · otwarte wagi436 błędów wywołania / 5 000 | 58,80% | 57,62%–59,92% | 57,52% | 60,08% | 66,0 | 119,4 | 0,0800 | Serwer modelu1 × H100 80 GB |
| 94 decider-2b (v11)¹2B · otwarte wagi | 58,66% | 57,40%–59,94% | 58,04% | 59,28% | 20,3 | 168,5 | 0,0248 | decider-ai 1.8.11 × H100 80 GB |
| 95 JEV-Qwen3.5-9B-Base-NVFP4¹9B · otwarte wagi | 57,26% | 55,92%–58,52% | 57,76% | 56,76% | 31,8 | 177,9 | 0,0264 | SGLang · NVFP4 + adapter HTTP1 × RTX PRO 6000 Blackwell 96 GB |
| 96 Phi-4-mini-instruct (raw, letter logits)¹3.8B · otwarte wagi · pomiar kontrolny | 55,78% | 54,40%–57,02% | 53,68% | 57,88% | 35,9 | 132,9 | 0,0171 | vLLM · logity liter1 × H100 80 GB |
| 97 Decision 2B (preview)¹2B · otwarte wagi431 błędów wywołania / 5 000 | 54,62% | 53,36%–55,78% | 49,24% | 60,00% | 48,7 | 76,8 | 0,0580 | model.decide + adapter HTTP1 × H100 80 GB |
| 98 basal-1.0 · 1.5B1.5B · otwarte wagi | 52,24% | 50,94%–53,62% | 52,72% | 51,76% | 14,6 | 354,4 | 0,0549 | basal · fast1 × H100 80 GB |
| 99 Nemotron Diffusion 8B (Nemotron\_Jev)¹8B · otwarte wagi | 51,54% | 50,16%–52,94% | 48,72% | 54,36% | 38,6 | 210,7 | 0,0628 | Nemotron\_Jev · vLLM1 × H100 80 GB |
| 100 Malkuth-2B¹2B · otwarte wagi108 błędów wywołania / 5 000 | 49,98% | 48,74%–51,26% | 48,16% | 51,80% | 73,2 | 119,9 | 0,0765 | kev.serve1 × H100 80 GB |
| 101 Qwen3-Reranker-4B (as a decider)¹4B · otwarte wagi · pomiar kontrolny | 47,20% | 46,02%–48,44% | 45,92% | 48,48% | 131,6 | 1 089,1 | 0,2743 | Transformers · adapter rerankera1 × H100 80 GB |
| 102 Certo v1¹0.4B · otwarte wagi | 28,26% | 27,04%–29,38% | 29,40% | 27,12% | 20,8 | 25,0 | 0,0238 | certo · adapter HTTP1 × H100 80 GB |

**† Wynik nie jest niezależny.** Model lub model z tej samej rodziny uczestniczył w budowie albo sprawdzaniu pytań. Tych wyników nie należy traktować jako niezależnego porównania.

**¹ Różnice konfiguracji.** Cygnet: adapter nazw pól i limit 16 384 tokenów; dłuższe wejścia odrzucone przez serwer liczą się jako błędy. basal-1.5 i max na SGLang: limit kontekstu 32 768 zamiast domyślnego 4 096. basal-2.0 i basal-omni-1.0: odpowiedzi z trybu `--deterministic` (wynik niezależny od obciążenia), czas i koszt z osobnego przebiegu w trybie domyślnym na tym samym serwerze; basal-omni-1.0 działa w trybie eager. Werdykt mierzy tylko tekst: basal-omni (eksperymentalna linia basal na Gemma 4, mini 4B i max 12B) przyjmuje też obrazy i dźwięk, ale tej tabeli to nie dotyczy ([wyniki obrazu i dźwięku](https://basal.si5.pl/benchmark/#multimodalne)). Winnow: kontekst 65 536 zgodny z README. Nox: H100 NVL 94 GB i tryb eager. Interfejsy decyzyjne dostawców (Decisions API przez OpenRouter) otrzymują każde pytanie jako jedno pytanie `choice`; wybieramy opcję o najwyższym zwróconym prawdopodobieństwie. Część otwartych modeli bez własnego serwera HTTP działa przez nasz cienki adapter, który nie zmienia odpowiedzi modelu. Pomiary pochodzą z różnych środowisk chmurowych. Kartę GPU podajemy przy każdym systemie.

**Blackwell i H100.** Systemy oznaczone „RTX PRO 6000 Blackwell 96 GB” działają na tej karcie, zgodnie z konfiguracją autorów albo dlatego, że nie mieszczą się na jednym H100. Ich czas i koszt dotyczą innego sprzętu niż pozostałe wiersze.

**Pomiary kontrolne.** Qwen3-4B-Instruct-2507 i Phi-4-mini-instruct to modele ogólne oceniane przez prawdopodobieństwa liter odpowiedzi. Qwen3-Reranker-4B ocenia opcje przez adapter rerankera i skraca długie wejścia do 8 192 tokenów. Te trzy wiersze są punktami odniesienia w Werdykcie, a nie wyspecjalizowanymi modelami decyzyjnymi.

**\* Respan Span-02 · endpoint z rozumowaniem:** zmierzony przez hostowany endpoint z domyślnym rozumowaniem dostawcy (nie jeden przebieg); pomiar lokalny w toku.

**Bez pomiaru szybkości.** basal-omni-1.0-ultra: czas i koszt — pomiar szybkości jeszcze niewykonany. Trafność pochodzi z pełnego przebiegu 5 000 pytań.

**Ograniczenia wykonania.** Błędy wywołań i nieodczytane odpowiedzi liczą się jako błędne decyzje; ich liczby podajemy przy nazwach. Decision 2B odrzucił 431 pytań z powodu limitów długości, Malkuth-2B — 108, a jev-local (Qwen3.5-9B, HF scorer) — 436 z powodu limitu 4 096 tokenów. Czas p50 i p95 jev-local wyliczono ze 181 poprawnie obsłużonych zapytań w próbie 200 pytań. Certo odczytuje tylko pierwsze 64 tokeny pytania i stanu. Czas bibliotek bez własnego serwera obejmuje nasz adapter HTTP. Spark, local-jev i so1 używają referencyjnej ścieżki Transformers bez FLA; Spark dodatkowo wraca do pełnego przebiegu po błędzie cache. JevK5 v0.2 korzysta z referencyjnej konwolucji. Instalacja zależności na CPU podczas części pomiaru decider-2b mogła nieco zaniżyć jego przepustowość.

**Protokół Nox.** Pełny wynik 5 000 pytań jest w głównej tabeli. Model korzysta z trybu eager na H100 NVL 94 GB; jego szybka ścieżka jest zweryfikowana przez autorów dla ROCm. Czas i przepustowość zmierzono z jednym procesem serwera. Pozostałe 3 000 pytań wykonano z pulą pięciu procesów wyłącznie na potrzeby oceny trafności; ich czasu nie użyto do wyliczania kosztu ani szybkości.

**Jak liczymy koszt.** H100 i H100 NVL: stawka porównawcza 3,95 USD/h; RTX PRO 6000 Blackwell: 2,09 USD/h. Koszt 1 000 decyzji wynika z przepustowości przy pełnym obciążeniu. API: koszt raportowany przez dostawcę. Własne wdrożenie przy małym ruchu może kosztować więcej na decyzję. Znak „—” oznacza brak danych.

### Trafność a czas odpowiedzi

Im wyżej i bliżej lewej strony, tym lepszy wynik przy krótszym oczekiwaniu. Oś czasu jest logarytmiczna; dokładne wartości znajdziesz w tabeli.

Rodzina basalInne otwarte modeleAPI

### Konfiguracje basal-2.0 i basal-omni

Trzy modele tekstowe i dwa multimodalne na H100 80 GB. Każdy otrzymał te same 5 000 pytań tekstowych Werdyktu. Poniżej zestawiamy konfiguracje i wyniki obu rodzin z pełnej tabeli powyżej.

basal-2.0 + basal-omni · Werdykt PL + EN · 5 000 pytań tekstowych · BF16

| Model / parametry | Silnik · BF16 | Sprzęt | PL + EN ↑ | Czas p50 ms ↓ | Czas p95 ms ↓ | USD / 1000 decyzji ↓ |
| --- | --- | --- | --- | --- | --- | --- |
| basal-2.0-mini1.5B | basal v2.0.0 · fast | 1 × H100 80 GB | 61,84% | 15,5 | 93,9 | 0,0103 |
| basal-2.04.5B | basal v2.0.0 · fast | 1 × H100 80 GB | 72,86% | 25,0 | 188,1 | 0,0341 |
| basal-2.0-max11B | basal v2.0.0 · fast | 1 × H100 80 GB | 78,40% | 37,4 | 344,3 | 0,0678 |
| basal-omni-1.0-mini4B | basal-serve · eager | 1 × H100 80 GB | 76,88% | 66,6 | 675,1 | 0,1263 |
| basal-omni-1.0-max12B | basal-serve · eager | 1 × H100 80 GB | 82,28% | 76,2 | 1 359,6 | 0,2631 |

**Tekst w obu rodzinach.** basal-2.0 działa w trybie fast, a basal-omni w trybie eager. Wszystkie pomiary dotyczą BF16, jednej kolejności opcji i włączonej kalibracji. Trafność, czas i koszt odnoszą się tutaj wyłącznie do tekstu. [Zobacz osobne wyniki obrazów i dźwięku basal-omni →](https://basal.si5.pl/benchmark/#multimodalne)

**Warunki pomiaru.** Trafność pochodzi z pełnych 5 000 pytań w trybie `--deterministic`. Czasy p50 i p95 zmierzono na 200 wspólnych pytaniach, po jednym zapytaniu naraz. Czas i przepustowość pochodzą z osobnego przebiegu w trybie domyślnym na tym samym serwerze co pomiar trafności danego modelu.

**Koszt według wspólnej stawki.** Wszystkie koszty przeliczono z przepustowości przy 16 równoległych zapytaniach i umownej stawki 3,95 USD/h. To stawka porównawcza benchmarku; nie cena wynajmu tej maszyny.

BASAL-OMNI / OBRAZ I DŹWIĘK

## Ta sama decyzja. Inne źródło informacji.

[Pobierz wyniki JSON ↓](https://basal.si5.pl/assets/benchmarks/omni-probe-pl.json)

To osobna, mała polska próba **omni-probe-pl**: pięć zadań i 595 pytań dla każdego modelu. Każde pytanie zadano z obrazem lub nagraniem oraz z jego tekstowym odpowiednikiem. Werdykt w pierwszej zakładce mierzy wyłącznie tekst — także dla modeli omni.

Eksperymentalne

basal-omni-1.0-mini (4B), max (12B) i ultra (31B) trenowano na decyzjach tekstowych. Media obsługują enkodery Gemma 4 bez dodatkowego treningu multimodalnego (zero-shot). Progi pewności dopasowano na tekście, więc wymagają weryfikacji na własnych mediach.

### Co wynika z tych pomiarów?

**Max lepiej odczytuje obrazy dokumentów:** 83,8% wobec 72,5% mini. Oba modele tracą część trafności w porównaniu z podaniem gotowego tekstu dokumentu.

**Ultra najlepiej odczytuje obrazy:** 89,4% przy obrazach dokumentów i 80,0% przy zdjęciach. Nie przyjmuje dźwięku: model bazowy 31B nie ma kodera audio.

**Mini lepiej radzi sobie z nagraniami:** 92,1% rozpoznanych intencji wobec 71,4% max. Gdy masz transkrypcję, warto porównać jej wynik z bezpośrednim audio.

**Zdjęcia pomagają względem samego pytania,** ale te wyniki są zbliżone do modelu bazowego bez treningu basal. Nie traktujemy ich jako dowodu ogólnej przewagi multimodalnej.

To małe próby o różnej trudności. Nie tworzymy z nich wspólnego rankingu ani nie łączymy ich z wynikiem Werdyktu.

**Trafność z obrazu lub dźwięku**Skala 0–100% · więcej = lepiej

omni-mini · 4B omni-max · 12B omni-ultra · 31B

#### Obraz dokumentu

Obraz · 160 pytań

mini**72,5%**

max**83,8%**

ultra**89,4%**

#### Prawdziwe zdjęcie

Obraz · 150 pytań

mini**66,7%**

max**66,0%**

ultra**80,0%**

#### Intencja nagranej prośby · MINDS-14

Dźwięk · 140 pytań

mini**92,1%**

max**71,4%**

ultra: bez dźwięku (model 31B nie ma kodera audio)

#### Temat nagranego fragmentu

Dźwięk · 100 pytań

mini**87,0%**

max**51,0%**

ultra: bez dźwięku (model 31B nie ma kodera audio)

#### Decyzja z nagranej wypowiedzi

Dźwięk · 45 pytań

mini**84,4%**

max**55,6%**

ultra: bez dźwięku (model 31B nie ma kodera audio)

### Media, tekst i model bazowy — wszystkie wyniki

Dla obrazów dokumentów porównaniem jest ich treść, a dla nagrań transkrypcja. Przy zdjęciach porównanie tekstowe zawiera **tylko pytanie, bez informacji ze zdjęcia**. Nie jest więc równoważnym opisem obrazu.

omni-probe-pl · trafność · wyniki z kart modeli wydania 1.0

| Zadanie / pytania | Model | Z mediów ↑ | Z tekstu ↑ | Gemma 4 bez treningu basal z tych samych mediów ↑ | Co zawiera wejście tekstowe? |
| --- | --- | --- | --- | --- | --- |
| Obraz dokumentu160 pytań · Obraz | omni-mini | 72,5% | 83,1% | 50,0%Gemma 4 E4B | Treść dokumentu |
| Obraz dokumentu160 pytań · Obraz | omni-max | 83,8% | 90,0% | 67,5%Gemma 4 12B | Treść dokumentu |
| Obraz dokumentu160 pytań · Obraz | omni-ultra | 89,4% | 93,1% | 76,9%Gemma 4 12B | Treść dokumentu |
| Prawdziwe zdjęcie150 pytań · Obraz | omni-mini | 66,7% | 50,7% | 64,0%Gemma 4 E4B | Samo pytanie, bez zdjęcia |
| Prawdziwe zdjęcie150 pytań · Obraz | omni-max | 66,0% | 52,7% | 68,0%Gemma 4 12B | Samo pytanie, bez zdjęcia |
| Prawdziwe zdjęcie150 pytań · Obraz | omni-ultra | 80,0% | 61,3% | 83,3%Gemma 4 12B | Samo pytanie, bez zdjęcia |
| Intencja nagranej prośby · MINDS-14140 pytań · Dźwięk | omni-mini | 92,1% | 94,3% | 90,0%Gemma 4 E4B | Transkrypcja |
| Intencja nagranej prośby · MINDS-14140 pytań · Dźwięk | omni-max | 71,4% | 92,9% | 70,0%Gemma 4 12B | Transkrypcja |
| Temat nagranego fragmentu100 pytań · Dźwięk | omni-mini | 87,0% | 90,0% | 86,0%Gemma 4 E4B | Transkrypcja |
| Temat nagranego fragmentu100 pytań · Dźwięk | omni-max | 51,0% | 93,0% | 55,0%Gemma 4 12B | Transkrypcja |
| Decyzja z nagranej wypowiedzi45 pytań · Dźwięk | omni-mini | 84,4% | 95,6% | 60,0%Gemma 4 E4B | Transkrypcja |
| Decyzja z nagranej wypowiedzi45 pytań · Dźwięk | omni-max | 55,6% | 95,6% | 57,8%Gemma 4 12B | Transkrypcja |

**Zakres.** 160 pytań o renderowane obrazy dokumentów, 150 o prawdziwe zdjęcia, 140 o intencje nagranych próśb (MINDS-14), 100 o temat nagrania i 45 o decyzję na podstawie wypowiedzi. Ten sam zestaw dla mini, max i ultra; ultra tylko obrazy (dwa pierwsze zadania). Wyniki zaokrąglone zgodnie z kartami modeli; różnice kilku punktów na tak małych próbach mogą wynikać z przypadku.

**Osobne media i mieszane wejścia.** Powyższe wyniki dotyczą pojedynczego rodzaju medium. W oddzielnej próbie 20 par obrazu dokumentu i nagranej prośby dodanie drugiego medium zmieniło 5–15% odpowiedzi mini i 10–25% max. Najstabilniej wysyłać pytanie tylko z mediami, których dotyczy.

**Źródła.** Agregaty z kart modeli: [basal-omni-1.0-mini](https://huggingface.co/Remek/basal-omni-1.0-mini#images-and-audio) · [basal-omni-1.0-max](https://huggingface.co/Remek/basal-omni-1.0-max#images-and-audio) · [basal-omni-1.0-ultra](https://huggingface.co/Remek/basal-omni-1.0-ultra#images). Eksport JSON zawiera sumy SHA-256 użytych źródeł. Więcej o protokole, uruchomieniu i ograniczeniach: [artykuł o wydaniu](https://basal.si5.pl/blog/basal-2-0/#omni).

**Czas i koszt.** W tym zestawie nie opublikowano porównywalnych pomiarów czasu i kosztu dla mediów. Nie przenosimy tu wyników szybkości z tekstowego Werdyktu.

02 / POLISH ITEMS ONLY

## Jak modele radzą sobie po polsku?

Ranking 96 systemów z eksportu Werdyktu z 16 października 2026. Trafność to średnia z 10 polskich kategorii, 2 500 pytań. Czas to mediana dla całego Werdyktu, a nie osobny pomiar tylko polskich pytań. Modele ogólne i reranker oznaczono jako pomiary kontrolne.

**72,9% basal-2.0****78,7% basal-2.0-max****62,8% basal-2.0-mini**

Polish items only · systemy decyzyjne i pomiary kontrolne

| Miejsce | Model | Parametry | Trafność PL ↑ | Mediana czasu ↓ |
| --- | --- | --- | --- | --- |
| 1 | Respan Span-02 · endpoint z rozumowaniemHostowany endpoint dostawcy | 26B MoE (4B active) | 89,8% | 239,2 ms |
| 2 | basal-omni-1.0-ultra1 × H200 141 GB | 31B | 88,1% | — |
| 3 | Liquid d1-ultraAPI dostawcy | nie podano | 87,9% | 256,1 ms |
| 4 | pplx-decider-v1.1-27b (Decisions API)API dostawcy | 27B | 85,0% | 263,5 ms |
| 5 | René-1 31B FP81 × H100 80 GB | 31B | 85,0% | 139,8 ms |
| 6 | Respan Span-02 · 750 ms1 × RTX PRO 6000 Blackwell 96 GB | 26B MoE (4B active) | 84,8% | 34,0 ms |
| 7 | Mercury Decide (OpenRouter Decisions API)API dostawcy | nie podano | 84,5% | 420,4 ms |
| 8 | deck-31B1 × H100 80 GB | 31B | 83,4% | 1,3 s |
| 9 | decisio v0.8.0 on gemma-4-31B-it1 × H100 80 GB | 31B | 83,4% | 64,9 ms |
| 10 | Quyet-1.0-Large1 × H100 80 GBBłędy wywołania w pełnym teście: 29 / 5 000 | 31.3B (30.7B text) | 82,8% | 149,0 ms |
| 11 | Decider chat · Gemma-4-31B1 × RTX PRO 6000 Blackwell 96 GB | 31B | 82,5% | 145,6 ms |
| 12 | basal-omni-1.0-max1 × H100 80 GB | 12B | 82,4% | 76,2 ms |
| 13 | Jev 1.14API dostawcy | nie podano | 82,4% | 267,6 ms |
| 14 | Jebadiah 27B1 × H100 80 GB | 27B | 82,3% | 96,7 ms |
| 15 | Jev 1.13.0API dostawcy | — | 82,0% | 286,4 ms |
| 16 | Eikos-27B-FP8 (v1.3)1 × H100 80 GB | 27B | 81,9% | 115,8 ms |
| 17 | basal-omni-1.1-max1 × H100 80 GB | 12B | 81,9% | 85,5 ms |
| 18 | pplx-decider-v1-27b1 × H100 80 GBBłędy wywołania w pełnym teście: 112 / 5 000 | 27B | 81,8% | 93,0 ms |
| 19 | Clef (OpenRouter Decisions API)API dostawcy | 27B | 81,3% | 377,1 ms |
| 20 | Surogate Rune 26B-A4B v31 × RTX PRO 6000 Blackwell 96 GB | 26B-A4B | 80,9% | 164,1 ms |
| 21 | Respan Span-02 · 300 ms1 × RTX PRO 6000 Blackwell 96 GB | 26B MoE (4B active) | 80,6% | 34,0 ms |
| 22 | Liquid d1API dostawcy | — | 80,5% | 329,0 ms |
| 23 | Bobcat Flash 1.21 × H100 80 GB | 26B-A4B | 80,0% | 38,4 ms |
| 24 | simple-jev · Qwen3.8-27B (featherless)1 × H100 80 GB | 27B | 80,0% | 277,3 ms |
| 25 | Reflex 27B (Decision Index 0.2 build)1 × H100 80 GB | 27B | 79,5% | 135,4 ms |
| 26 | Xor 26B-A4B 1.01 × H100 80 GB | 26B-A4B | 79,5% | 95,9 ms |
| 27 | Respan Span-02 · bez rozumowania1 × RTX PRO 6000 Blackwell 96 GB | 26B MoE (4B active) | 79,4% | 30,7 ms |
| 28 | GPT-6 Luna DecisionsAPI dostawcy | — | 79,2% | 438,0 ms |
| 29 | decider-12b v21 × H100 80 GB | 12B | 79,1% | 48,9 ms |
| 30 | Microsoft-Decision-1 (OpenRouter Decisions API)API dostawcy | nie podano | 79,0% | 331,7 ms |
| 31 | Cygnet1 × H100 80 GB | 12B | 79,0% | 39,6 ms |
| 32 | basal-2.0-max1 × H100 80 GB | 11B | 78,7% | 37,4 ms |
| 33 | Winnow-12B (Q8)1 × H100 80 GB | 12B | 78,6% | 126,2 ms |
| 34 | Solar DecideAPI dostawcy | — | 78,5% | 1,3 s |
| 35 | JEVfire (Qwen3.8-27B-FP8)1 × H100 80 GB | 27B | 77,8% | 93,6 ms |
| 36 | basal-1.5-max1 × H100 80 GB | 11B | 77,7% | 67,1 ms |
| 37 | basal-omni-1.0-mini1 × H100 80 GB | 4B | 77,5% | 66,6 ms |
| 38 | Xor 1.21 × RTX PRO 6000 Blackwell 96 GB | 35B-A3B | 77,1% | 145,9 ms |
| 39 | decider-12b v11 × H100 80 GB | 12B | 76,9% | 47,6 ms |
| 40 | Decider chat · Qwen3.6-27B1 × H100 80 GB | 27B | 76,8% | 90,7 ms |
| 41 | Jev-Omni1 × H100 80 GB | 12B | 76,3% | 1,1 s |
| 42 | H2O-Lightning-4B v1.11 × H100 80 GB | 4B | 74,5% | 58,6 ms |
| 43 | JPT-9B1 × H100 80 GB | 9B | 74,1% | 159,5 ms |
| 44 | Decision 1.0 Lux 9B1 × H100 80 GB | 9B | 73,8% | 56,6 ms |
| 45 | DREX v1.5 (OpenRouter Decisions API)API dostawcy | nie podano | 73,6% | 310,8 ms |
| 46 | basal-2.01 × H100 80 GB | 4.5B | 72,9% | 25,0 ms |
| 47 | basal-1.51 × H100 80 GB | 4.5B | 72,4% | 33,8 ms |
| 48 | MedDecider-9B1 × H100 80 GB | 9.7B | 72,1% | 151,0 ms |
| 49 | Decision-2.0-Nox-4B1 × H100 NVL 94 GB | 4B (4.21B) | 70,9% | 863,8 ms |
| 50 | Hopper (G) 1.21 × H100 80 GB | 4B | 70,7% | 59,5 ms |
| 51 | decider-35b-a3b NVFP41 × RTX PRO 6000 Blackwell 96 GB | 35B-A3B | 70,2% | 48,0 ms |
| 52 | djev1 × H100 80 GBBłędy wywołania w pełnym teście: 274 / 5 000 | 26B (4B active) | 70,2% | 66,6 ms |
| 53 | Clef Flash (OpenRouter Decisions API)API dostawcy | 9B | 70,1% | 345,8 ms |
| 54 | JPT-4B1 × H100 80 GB | 4B | 70,1% | 69,5 ms |
| 55 | Clef-Flash1 × H100 80 GB | 9B | 70,1% | 1,7 s |
| 56 | sonda-1.0-4B1 × H100 NVL 94 GBBłędy wywołania w pełnym teście: 113 / 5 000 | 4B | 69,9% | 51,4 ms |
| 57 | Decision 4B v1.21 × H100 80 GB | 4B | 69,8% | 28,7 ms |
| 58 | decider-4b v21 × H100 80 GB | 4B | 69,7% | 27,8 ms |
| 59 | Qwen3-32B, zero-shot (jqv)1 × H100 80 GB | 32B | 69,5% | 129,5 ms |
| 60 | Hopper1 × H100 80 GB | 4B | 69,4% | 60,4 ms |
| 61 | Clef Omni (OpenRouter Decisions API)API dostawcy | nie podano | 69,1% | 182,3 ms |
| 62 | Plumb-4B1 × H100 80 GB | 4B | 68,9% | 27,7 ms |
| 63 | spark-s1-4b-v61 × H100 80 GB | 4B | 68,8% | 217,4 ms |
| 64 | Decision 4B v1.11 × H100 80 GB | 4B | 68,8% | 28,5 ms |
| 65 | MedDecider-4B1 × H100 80 GB | 4.7B | 68,4% | 151,1 ms |
| 66 | JevK5 v0.31 × H100 80 GB | 4B | 68,3% | 28,4 ms |
| 67 | Tev1 4B ExperimentalAPI dostawcy | 4B | 68,0% | 239,6 ms |
| 68 | Kev 1.0 (kev-4b)1 × H100 80 GB | 4B | 67,2% | 34,1 ms |
| 69 | Jet v6.21 × H100 80 GB | 4B | 66,8% | 934,5 ms |
| 70 | Imajev-4B1 × H100 80 GBBłędy wywołania w pełnym teście: 436 / 5 000 | 4B | 66,6% | 112,7 ms |
| 71 | JevK5 v0.2 (4B)1 × H100 80 GB | 4B | 66,4% | 30,7 ms |
| 72 | basal-1.0 · 4.5B1 × H100 80 GB | 4.5B | 66,2% | 26,5 ms |
| 73 | Kev 4B (OpenRouter Decisions API)API dostawcyBłędy wywołania w pełnym teście: 108 / 5 000 | 4B | 66,0% | 878,8 ms |
| 74 | sonda-1.1-4B1 × H100 80 GB | 4B | 63,9% | 67,2 ms |
| 75 | basal-2.0-mini1 × H100 80 GB | 1.5B | 62,8% | 15,5 ms |
| 76 | local-jev (Qwen3.5-4B)1 × H100 80 GB | 4B | 62,5% | 142,7 ms |
| 77 | typecastlm v1.3.0 (Qwen3.5 3.8B)1 × H100 80 GB | 3.8B | 62,4% | 95,2 ms |
| 78 | Malkuth-4B1 × H100 80 GBBłędy wywołania w pełnym teście: 108 / 5 000 | 4B | 62,2% | 153,2 ms |
| 79 | Manchego v2.11 × H100 80 GB | 4B | 62,2% | 73,5 ms |
| 80 | basal-1.5-mini1 × H100 80 GB | 1.5B | 61,9% | 14,2 ms |
| 81 | lev1 × H100 80 GB | 4B | 61,7% | 157,6 ms |
| 82 | jev-local (Qwen3.5-9B, HF scorer)1 × H100 80 GBBłędy wywołania w pełnym teście: 436 / 5 000 | 9B | 61,6% | 460,7 ms |
| 83 | Qwen3-4B-Instruct-2507 (raw, letter logits)Pomiar kontrolny1 × H100 80 GB | 4B | 61,4% | 40,0 ms |
| 84 | metask-jev-4b1 × H100 80 GBBłędy wywołania w pełnym teście: 441 / 5 000 | 4B | 60,7% | 107,8 ms |
| 85 | open-alternative-jev (so1, Qwen3.5-4B)1 × H100 80 GB | 4B | 59,2% | 101,4 ms |
| 86 | decider-2b (v11)1 × H100 80 GB | 2B | 58,0% | 20,3 ms |
| 87 | JEV-Qwen3.5-9B-Base-NVFP41 × RTX PRO 6000 Blackwell 96 GB | 9B | 57,8% | 31,8 ms |
| 88 | SemIf1 × H100 80 GBBłędy wywołania w pełnym teście: 436 / 5 000 | 4B | 57,5% | 66,0 ms |
| 89 | Solar Decide FlashAPI dostawcy | — | 57,1% | 940,7 ms |
| 90 | Phi-4-mini-instruct (raw, letter logits)Pomiar kontrolny1 × H100 80 GB | 3.8B | 53,7% | 35,9 ms |
| 91 | basal-1.0 · 1.5B1 × H100 80 GB | 1.5B | 52,7% | 14,6 ms |
| 92 | Decision 2B (preview)1 × H100 80 GBBłędy wywołania w pełnym teście: 431 / 5 000 | 2B | 49,2% | 48,7 ms |
| 93 | Nemotron Diffusion 8B (Nemotron\_Jev)1 × H100 80 GB | 8B | 48,7% | 38,6 ms |
| 94 | Malkuth-2B1 × H100 80 GBBłędy wywołania w pełnym teście: 108 / 5 000 | 2B | 48,2% | 73,2 ms |
| 95 | Qwen3-Reranker-4B (as a decider)Pomiar kontrolny1 × H100 80 GB | 4B | 45,9% | 131,6 ms |
| 96 | Certo v11 × H100 80 GB | 0.4B | 29,4% | 20,8 ms |

### Dla porównania: duże modele przez API

Inny punkt kompromisu między trafnością a czasem odpowiedzi. † Oznacza udział modelu lub jego rodziny w budowie albo sprawdzaniu pytań; taki wynik nie stanowi niezależnego porównania.

Polish items only · modele ogólne przez API

| Model | Trafność PL ↑ | Mediana czasu ↓ |
| --- | --- | --- |
| Gemini 3.8 Flash | 99,6% | 3,3 s |
| GPT-6.1 Sol | 99,2% | 2,2 s |
| Claude Opus 5.5 † | 99,2% | 5,5 s |
| GPT-6 Astra † | 99,2% | 2,0 s |
| Gemini 3.1 Pro (preview) † | 97,9% | 5,5 s |
| GPT-6 Luna | 97,8% | 2,4 s |

Źródło: polskie pytania pełnego testu, eksport Werdyktu z 16 października 2026. Nox zmierzono na H100 NVL 94 GB, systemy oznaczone „RTX PRO 6000 Blackwell” na tej karcie, pozostałe otwarte modele na H100 80 GB. Różnice poniżej około 2 punktów procentowych w polskim wyniku ogólnym należy interpretować ostrożnie.

03 / POLISH, CATEGORY BY CATEGORY

## Jedna średnia nie mówi wszystkiego.

Porównaj 96 systemów w 10 rodzajach decyzji. Każda polska kategoria liczy około 250 pytań. Kolor pomaga odczytać wynik, a każda komórka zawiera dokładną wartość.

Przewiń tabelę poziomo, aby zobaczyć wszystkie modele. Wyniki tylko dla języka polskiego.

Polish, category by category · trafność

| Kategoria | Respan Span-02 · endpoint z rozumowaniem | basal-omni-1.0-ultra | Liquid d1-ultra | pplx-decider-v1.1-27b (Decisions API) | René-1 31B FP8 | Respan Span-02 · 750 ms | Mercury Decide (OpenRouter Decisions API) | deck-31B | decisio v0.8.0 on gemma-4-31B-it | Quyet-1.0-Large | Decider chat · Gemma-4-31B | basal-omni-1.0-max | Jev 1.14 | Jebadiah 27B | Jev 1.13.0 | Eikos-27B-FP8 (v1.3) | basal-omni-1.1-max | pplx-decider-v1-27b | Clef (OpenRouter Decisions API) | Surogate Rune 26B-A4B v3 | Respan Span-02 · 300 ms | Liquid d1 | Bobcat Flash 1.2 | simple-jev · Qwen3.8-27B (featherless) | Reflex 27B (Decision Index 0.2 build) | Xor 26B-A4B 1.0 | Respan Span-02 · bez rozumowania | GPT-6 Luna Decisions | decider-12b v2 | Microsoft-Decision-1 (OpenRouter Decisions API) | Cygnet | basal-2.0-max | Winnow-12B (Q8) | Solar Decide | JEVfire (Qwen3.8-27B-FP8) | basal-1.5-max | basal-omni-1.0-mini | Xor 1.2 | decider-12b v1 | Decider chat · Qwen3.6-27B | Jev-Omni | H2O-Lightning-4B v1.1 | JPT-9B | Decision 1.0 Lux 9B | DREX v1.5 (OpenRouter Decisions API) | basal-2.0 | basal-1.5 | MedDecider-9B | Decision-2.0-Nox-4B | Hopper (G) 1.2 | decider-35b-a3b NVFP4 | djev | Clef Flash (OpenRouter Decisions API) | JPT-4B | Clef-Flash | sonda-1.0-4B | Decision 4B v1.2 | decider-4b v2 | Qwen3-32B, zero-shot (jqv) | Hopper | Clef Omni (OpenRouter Decisions API) | Plumb-4B | spark-s1-4b-v6 | Decision 4B v1.1 | MedDecider-4B | JevK5 v0.3 | Tev1 4B Experimental | Kev 1.0 (kev-4b) | Jet v6.2 | Imajev-4B | JevK5 v0.2 (4B) | basal-1.0 · 4.5B | Kev 4B (OpenRouter Decisions API) | sonda-1.1-4B | basal-2.0-mini | local-jev (Qwen3.5-4B) | typecastlm v1.3.0 (Qwen3.5 3.8B) | Malkuth-4B | Manchego v2.1 | basal-1.5-mini | lev | jev-local (Qwen3.5-9B, HF scorer) | Qwen3-4B-Instruct-2507 (raw, letter logits) | metask-jev-4b | open-alternative-jev (so1, Qwen3.5-4B) | decider-2b (v11) | JEV-Qwen3.5-9B-Base-NVFP4 | SemIf | Solar Decide Flash | Phi-4-mini-instruct (raw, letter logits) | basal-1.0 · 1.5B | Decision 2B (preview) | Nemotron Diffusion 8B (Nemotron\_Jev) | Malkuth-2B | Qwen3-Reranker-4B (as a decider) | Certo v1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Brak wystarczających danychabstain | 85,6% | 86,0% | 93,2% | 78,8% | 76,0% | 86,0% | 84,4% | 80,0% | 80,4% | 77,2% | 78,0% | 80,8% | 78,0% | 83,6% | 73,2% | 84,8% | 81,2% | 88,8% | 82,4% | 76,8% | 76,4% | 79,2% | 72,8% | 78,8% | 81,2% | 75,2% | 73,2% | 80,0% | 70,8% | 73,6% | 70,4% | 80,0% | 70,8% | 79,6% | 72,0% | 73,6% | 74,8% | 66,0% | 70,4% | 69,6% | 68,0% | 69,2% | 67,2% | 64,8% | 75,2% | 69,6% | 70,0% | 56,4% | 63,2% | 59,2% | 56,4% | 57,2% | 58,8% | 61,6% | 59,2% | 60,0% | 69,6% | 60,8% | 61,6% | 57,2% | 64,4% | 63,6% | 60,0% | 69,2% | 53,6% | 57,6% | 57,6% | 59,6% | 51,2% | 74,0% | 57,6% | 59,2% | 59,2% | 50,4% | 54,8% | 53,2% | 48,4% | 49,6% | 44,8% | 52,0% | 51,6% | 52,0% | 51,2% | 54,0% | 51,2% | 48,0% | 51,2% | 51,6% | 50,8% | 45,2% | 41,6% | 42,0% | 34,8% | 36,4% | 28,8% | 21,2% |
| Następny krok agentaaction | 86,8% | 92,0% | 94,0% | 91,2% | 90,8% | 85,6% | 86,8% | 88,0% | 88,0% | 88,8% | 86,0% | 83,2% | 81,6% | 82,0% | 83,6% | 79,6% | 84,0% | 82,8% | 79,2% | 85,2% | 84,0% | 82,8% | 81,6% | 74,8% | 76,4% | 83,2% | 83,6% | 79,6% | 81,6% | 78,4% | 83,6% | 72,0% | 82,4% | 84,4% | 74,4% | 72,8% | 76,4% | 72,4% | 79,6% | 75,6% | 76,4% | 73,6% | 65,2% | 67,6% | 69,6% | 68,8% | 62,4% | 72,4% | 70,0% | 65,6% | 67,2% | 70,8% | 67,2% | 67,6% | 66,4% | 68,4% | 61,2% | 66,0% | 67,2% | 64,8% | 70,8% | 60,4% | 60,4% | 61,2% | 66,8% | 61,6% | 63,2% | 65,6% | 65,6% | 64,0% | 60,0% | 62,8% | 64,8% | 57,2% | 50,4% | 60,8% | 52,4% | 61,6% | 59,6% | 42,0% | 60,4% | 60,0% | 55,6% | 64,8% | 52,0% | 51,6% | 50,8% | 58,4% | 45,6% | 46,4% | 45,6% | 45,6% | 40,8% | 43,6% | 43,6% | 19,2% |
| Umowycontract | 89,6% | 83,6% | 78,8% | 77,6% | 80,8% | 78,0% | 77,2% | 78,8% | 80,4% | 74,4% | 77,6% | 78,4% | 73,6% | 73,6% | 76,0% | 76,8% | 77,2% | 76,4% | 74,4% | 76,0% | 74,0% | 72,0% | 73,6% | 73,2% | 72,0% | 73,2% | 72,8% | 73,2% | 73,2% | 72,8% | 75,2% | 70,8% | 71,6% | 64,8% | 73,6% | 69,6% | 66,0% | 72,8% | 70,8% | 71,2% | 69,6% | 66,8% | 65,6% | 68,4% | 62,4% | 65,2% | 64,8% | 63,6% | 65,6% | 66,4% | 63,2% | 68,0% | 64,4% | 62,0% | 64,8% | 64,4% | 60,4% | 57,6% | 62,8% | 62,8% | 61,6% | 62,8% | 64,8% | 58,8% | 64,8% | 63,2% | 63,2% | 59,6% | 57,2% | 62,8% | 60,8% | 59,2% | 60,0% | 56,4% | 50,4% | 58,8% | 58,0% | 57,6% | 59,2% | 54,8% | 54,0% | 60,4% | 54,4% | 59,2% | 50,0% | 50,0% | 50,4% | 56,8% | 51,2% | 49,6% | 48,4% | 48,0% | 51,2% | 43,6% | 41,2% | 32,8% |
| Ocena odpowiedzijudge | 91,2% | 93,2% | 92,8% | 94,0% | 92,0% | 88,0% | 93,2% | 91,2% | 91,6% | 90,0% | 90,8% | 90,4% | 89,2% | 90,8% | 92,0% | 89,2% | 88,8% | 91,2% | 86,4% | 86,8% | 85,2% | 82,4% | 86,4% | 86,8% | 86,0% | 87,2% | 83,6% | 82,0% | 88,8% | 87,2% | 89,2% | 84,8% | 88,8% | 74,0% | 83,2% | 85,6% | 85,6% | 85,2% | 87,6% | 83,2% | 84,4% | 76,8% | 80,8% | 79,6% | 72,4% | 81,6% | 80,0% | 70,8% | 67,2% | 69,2% | 68,4% | 83,6% | 70,0% | 75,2% | 70,0% | 71,6% | 69,6% | 66,4% | 75,2% | 68,0% | 68,0% | 71,6% | 69,6% | 70,8% | 61,2% | 66,8% | 60,8% | 62,0% | 63,6% | 68,8% | 67,2% | 59,2% | 61,6% | 57,2% | 72,4% | 57,2% | 62,0% | 57,2% | 68,4% | 69,2% | 55,2% | 70,4% | 62,8% | 64,0% | 54,0% | 56,8% | 57,2% | 55,2% | 60,0% | 52,4% | 44,8% | 57,6% | 50,4% | 45,2% | 50,0% | 44,4% |
| Długie dokumentylong | 78,4% | 88,0% | 81,6% | 76,4% | 78,4% | 69,6% | 80,8% | 70,4% | 69,6% | 69,2% | 66,4% | 74,8% | 75,6% | 73,6% | 74,4% | 70,8% | 74,0% | 56,0% | 76,0% | 73,6% | 68,4% | 77,2% | 69,2% | 70,8% | 66,8% | 67,2% | 68,8% | 68,0% | 68,0% | 72,0% | 66,8% | 71,2% | 66,8% | 65,2% | 66,0% | 69,6% | 70,4% | 66,8% | 62,4% | 60,4% | 66,8% | 65,2% | 65,2% | 64,0% | 68,4% | 62,0% | 61,2% | 66,0% | 60,0% | 62,8% | 66,8% | 35,6% | 63,6% | 55,6% | 63,2% | 46,4% | 56,0% | 64,0% | 50,8% | 61,6% | 63,2% | 56,8% | 54,4% | 54,8% | 59,6% | 55,6% | 59,6% | 57,2% | 57,2% | 8,0% | 54,4% | 58,8% | 46,0% | 58,0% | 52,4% | 50,8% | 50,4% | 46,0% | 43,6% | 55,6% | 57,2% | 7,6% | 51,6% | 6,4% | 48,8% | 55,2% | 46,4% | 6,8% | 50,0% | 46,8% | 46,8% | 0,0% | 34,8% | 38,0% | 38,4% | 26,4% |
| Rzeczywiste dokumentyrealdoc | 97,6% | 98,8% | 98,4% | 99,2% | 97,2% | 98,4% | 99,2% | 98,8% | 98,8% | 99,2% | 98,4% | 98,0% | 99,6% | 97,6% | 99,2% | 98,8% | 97,6% | 99,2% | 98,4% | 98,0% | 98,4% | 97,2% | 98,4% | 100,0% | 98,8% | 97,6% | 98,0% | 98,0% | 97,2% | 97,2% | 95,2% | 97,2% | 94,8% | 94,8% | 97,6% | 97,6% | 93,6% | 97,2% | 94,8% | 97,6% | 96,0% | 93,6% | 96,4% | 94,4% | 93,6% | 91,6% | 94,0% | 97,6% | 92,0% | 92,0% | 92,8% | 90,8% | 94,0% | 93,2% | 94,0% | 92,8% | 89,2% | 94,8% | 94,4% | 91,6% | 90,8% | 93,6% | 88,8% | 88,8% | 93,2% | 93,6% | 91,2% | 89,2% | 93,6% | 93,2% | 90,8% | 88,4% | 89,6% | 88,4% | 84,8% | 84,8% | 84,8% | 89,2% | 79,6% | 83,2% | 88,8% | 92,0% | 84,8% | 84,0% | 87,6% | 82,4% | 84,0% | 86,4% | 83,6% | 82,8% | 74,8% | 72,8% | 78,0% | 78,8% | 64,4% | 34,8% |
| Wyszukiwanie i RAGretrieval | 99,2% | 100,0% | 100,0% | 100,0% | 99,2% | 98,0% | 98,8% | 99,2% | 99,2% | 99,6% | 99,6% | 96,4% | 98,8% | 98,0% | 98,8% | 99,6% | 94,4% | 99,6% | 96,0% | 97,6% | 98,8% | 98,4% | 99,2% | 100,0% | 99,6% | 98,8% | 98,8% | 97,2% | 98,4% | 97,2% | 98,0% | 97,6% | 97,6% | 80,4% | 99,6% | 98,0% | 96,4% | 98,4% | 98,0% | 98,0% | 96,0% | 97,2% | 94,0% | 94,4% | 94,0% | 93,6% | 97,2% | 94,0% | 94,0% | 94,4% | 91,2% | 98,0% | 92,4% | 92,4% | 92,4% | 94,0% | 95,6% | 92,8% | 90,8% | 95,6% | 90,8% | 94,4% | 94,0% | 94,8% | 93,2% | 95,2% | 92,0% | 86,0% | 92,4% | 92,4% | 89,6% | 91,6% | 85,6% | 89,2% | 83,2% | 82,4% | 92,0% | 83,2% | 79,6% | 90,0% | 82,4% | 86,0% | 82,4% | 90,0% | 79,6% | 74,8% | 71,6% | 83,6% | 68,4% | 68,8% | 71,2% | 73,2% | 52,0% | 62,4% | 56,8% | 52,0% |
| Kierowanie zgłoszeńrouting | 97,2% | 99,6% | 98,8% | 98,4% | 99,2% | 97,6% | 97,2% | 99,2% | 98,4% | 98,4% | 98,4% | 98,4% | 98,8% | 100,0% | 98,8% | 99,2% | 98,0% | 99,2% | 98,8% | 97,6% | 96,4% | 97,2% | 98,0% | 99,2% | 100,0% | 96,8% | 96,8% | 95,6% | 97,6% | 97,2% | 96,4% | 96,8% | 97,6% | 92,8% | 98,8% | 99,2% | 96,8% | 98,4% | 96,4% | 98,8% | 92,8% | 94,4% | 96,0% | 96,8% | 93,6% | 92,8% | 94,0% | 94,4% | 96,8% | 95,6% | 92,4% | 93,6% | 93,6% | 93,6% | 93,6% | 96,0% | 93,2% | 94,0% | 93,2% | 96,8% | 92,4% | 93,6% | 93,6% | 92,0% | 94,4% | 92,8% | 95,2% | 91,2% | 92,0% | 94,8% | 93,2% | 89,2% | 91,2% | 90,4% | 88,0% | 90,0% | 90,0% | 89,2% | 90,0% | 86,8% | 81,6% | 91,6% | 87,6% | 89,6% | 86,0% | 82,4% | 82,0% | 89,2% | 83,2% | 75,6% | 75,6% | 76,8% | 78,4% | 70,0% | 68,8% | 18,0% |
| Reguły i terminyrules | 81,2% | 52,4% | 56,8% | 49,2% | 52,4% | 61,6% | 42,0% | 47,2% | 44,0% | 48,0% | 45,6% | 41,6% | 46,4% | 40,8% | 44,0% | 38,4% | 42,8% | 43,6% | 41,6% | 40,0% | 45,2% | 40,0% | 42,4% | 37,2% | 38,8% | 39,2% | 40,4% | 40,8% | 38,4% | 37,2% | 38,4% | 39,2% | 35,2% | 70,4% | 39,2% | 34,0% | 37,6% | 38,8% | 34,0% | 36,8% | 38,4% | 36,8% | 37,6% | 34,8% | 35,2% | 34,4% | 34,8% | 36,8% | 31,6% | 36,0% | 31,6% | 34,8% | 30,8% | 32,4% | 30,4% | 34,4% | 35,6% | 32,8% | 30,8% | 32,0% | 27,2% | 28,4% | 34,0% | 29,2% | 33,6% | 28,8% | 31,2% | 34,0% | 29,2% | 36,8% | 28,4% | 34,4% | 34,4% | 32,4% | 34,8% | 28,0% | 24,8% | 26,4% | 34,0% | 32,4% | 29,2% | 31,6% | 23,6% | 32,0% | 27,2% | 29,6% | 26,8% | 26,4% | 24,4% | 25,2% | 29,2% | 25,2% | 22,4% | 20,8% | 26,0% | 25,2% |
| Ocena na skaliscore | 91,2% | 87,6% | 84,4% | 85,6% | 84,0% | 85,6% | 85,2% | 81,6% | 83,2% | 83,2% | 84,0% | 82,4% | 82,4% | 83,2% | 80,4% | 82,0% | 80,8% | 81,6% | 79,6% | 77,2% | 79,2% | 78,8% | 78,8% | 79,2% | 75,6% | 76,4% | 78,0% | 78,0% | 77,2% | 77,6% | 77,2% | 77,2% | 80,0% | 78,8% | 74,0% | 76,8% | 77,2% | 74,8% | 74,8% | 77,2% | 74,8% | 71,6% | 73,2% | 73,6% | 71,6% | 69,2% | 66,0% | 68,8% | 68,8% | 65,6% | 72,0% | 69,2% | 66,4% | 67,6% | 66,8% | 71,2% | 68,0% | 67,6% | 68,4% | 63,6% | 62,0% | 64,0% | 68,8% | 68,0% | 64,0% | 67,6% | 66,4% | 67,2% | 65,6% | 70,8% | 62,0% | 59,2% | 67,6% | 59,6% | 56,4% | 58,8% | 60,8% | 62,4% | 63,2% | 53,2% | 56,4% | 64,0% | 60,0% | 62,8% | 55,2% | 49,6% | 57,2% | 60,8% | 54,0% | 44,0% | 49,2% | 51,2% | 44,4% | 42,8% | 41,2% | 20,0% |
| Wszystkie polskie pytania | 89,8% | 88,1% | 87,9% | 85,0% | 85,0% | 84,8% | 84,5% | 83,4% | 83,4% | 82,8% | 82,5% | 82,4% | 82,4% | 82,3% | 82,0% | 81,9% | 81,9% | 81,8% | 81,3% | 80,9% | 80,6% | 80,5% | 80,0% | 80,0% | 79,5% | 79,5% | 79,4% | 79,2% | 79,1% | 79,0% | 79,0% | 78,7% | 78,6% | 78,5% | 77,8% | 77,7% | 77,5% | 77,1% | 76,9% | 76,8% | 76,3% | 74,5% | 74,1% | 73,8% | 73,6% | 72,9% | 72,4% | 72,1% | 70,9% | 70,7% | 70,2% | 70,2% | 70,1% | 70,1% | 70,1% | 69,9% | 69,8% | 69,7% | 69,5% | 69,4% | 69,1% | 68,9% | 68,8% | 68,8% | 68,4% | 68,3% | 68,0% | 67,2% | 66,8% | 66,6% | 66,4% | 66,2% | 66,0% | 63,9% | 62,8% | 62,5% | 62,4% | 62,2% | 62,2% | 61,9% | 61,7% | 61,6% | 61,4% | 60,7% | 59,2% | 58,0% | 57,8% | 57,5% | 57,1% | 53,7% | 52,7% | 49,2% | 48,7% | 48,2% | 45,9% | 29,4% |

Przy około 250 pytaniach na kategorię różnice poniżej około 6 punktów procentowych mogą być szumem. To orientacyjna uwaga, nie test istotności każdej pary. Źródło: polskie kategorie z eksportu Werdyktu z 16 października 2026. Qwen3-4B-Instruct-2507, Phi-4-mini-instruct oraz Qwen3-Reranker-4B to pomiary kontrolne.

abstain

### Brak wystarczających danych

Wybór odpowiedzi lub stwierdzenie, że nie da się jej ustalić.

action

### Następny krok agenta

Działanie zgodne z podaną polityką i stanem procesu.

contract

### Umowy

Interpretacja zapisów oraz decyzje na podstawie warunków umowy.

judge

### Ocena odpowiedzi

Poprawność odpowiedzi i porównywanie dwóch propozycji.

long

### Długie dokumenty

Decyzje na podstawie dokumentów o długości 3–10 tys. tokenów.

realdoc

### Rzeczywiste dokumenty

Pytania o treść autentycznych dokumentów urzędowych.

retrieval

### Wyszukiwanie i RAG

Trafność fragmentu, wystarczalność kontekstu i oparcie twierdzenia w źródle.

routing

### Kierowanie zgłoszeń

Wybór kolejki, intencji i priorytetu według podanych zasad.

rules

### Reguły i terminy

Stosowanie reguł, terminów i warunków dotyczących kwot.

score

### Ocena na skali

Wybór poziomu zgodnego z opisem skali.

04 / OD BASAL-1.0 DO BASAL-2.0

## Postęp na polskich zadaniach.

### basal-1.0 → basal-1.5

Tabela historyczna z raportu wydania basal-1.5 (3.10.2026). Trzy oddzielne testy polskie, niezależne od tabeli Werdyktu. Najmocniejszy sygnał: 93,1% wobec 87,4% na 3 000 nowych decyzji utworzonych po zamrożeniu wag.

Rodzina basal · trafność na polskich zbiorach testowych · raport z 3.10.2026 (historyczny)

| Test | basal-1.0 · 4.5B | basal-1.5 · 4.5B | basal-1.5-max · 11B | basal-1.0 · 1.5B | basal-1.5-mini · 1.5B |
| --- | --- | --- | --- | --- | --- |
| Zamknięty test polski3 000 nowych decyzji; po zamrożeniu wag | 87,4% | 93,1% | 93,3% | 88,9% | 91,0% |
| Polskie decyzje7 081 przypadków | 88,6% | 92,3% | 94,0% | 85,1% | 87,7% |
| Wiedza ogólna po polsku3 079 przypadków | 73,7% | 74,1% | 79,4% | 65,6% | 66,7% |

JAK CZYTAĆ TE WYNIKI

### Specjalizacja w decyzjach, z mierzalnym postępem.

Główny model zyskuje 5,7 punktu procentowego na zamkniętym teście polskim (95% przedział różnicy: +4,5 do +6,8 pkt). Max ma zbliżony wynik w tym teście i przewagę w wiedzy ogólnej. Poprawa wiedzy ogólnej dla głównego modelu i mini nie jest statystycznie istotna.

### basal-1.5 → basal-2.0

W Werdykcie basal-2.0 zyskuje od 0,7 do 1,2 punktu procentowego, w granicach przedziałów ufności, a błąd kalibracji (ECE) spada: mini 0,086 → 0,035, 4.5B 0,068 → 0,060, max 0,074 → 0,044 (basal-1.5 jak w głównej tabeli: 4.5B i max przez SGLang, mini w trybie fast). Poniżej sześć osobnych testów. Obie generacje obsłużył ten sam silnik basal v2.0.0 na tych samych pytaniach, więc różnica jest sparowana, z 95% przedziałem bootstrap. Poprawę lub spadek wskazujemy tylko wtedy, gdy przedział nie obejmuje zera.

basal-1.5 → basal-2.0 · trafność i sparowana różnica [95% przedział, punkty procentowe]

| Test | Rozmiar | basal-1.5 | basal-2.0 | Różnica [95%] |
| --- | --- | --- | --- | --- |
| PL-Holdoutzamknięty test polski; 4 000 decyzji, rodziny zadań wyłączone z treningu | mini · 1.5B | 83,7% | 82,9% | −0,8 pp [−1,6; 0,0] · bez istotnej zmiany |
| 4.5B | 85,0% | 85,6% | +0,5 pp [−0,2; +1,3] · bez istotnej zmiany |
| max · 11B | 86,8% | 86,2% | −0,6 pp [−1,6; +0,4] · bez istotnej zmiany |
| Polskie decyzje7 081 przypadków | mini · 1.5B | 88,0% | 86,7% | −1,4 pp [−2,0; −0,8] · spadek |
| 4.5B | 92,2% | 92,4% | +0,1 pp [−0,4; +0,7] · bez istotnej zmiany |
| max · 11B | 94,0% | 93,8% | −0,2 pp [−0,8; +0,4] · bez istotnej zmiany |
| Wiedza ogólna po polsku3 079 przypadków | mini · 1.5B | 67,1% | 69,3% | +2,2 pp [+1,0; +3,4] · poprawa |
| 4.5B | 74,6% | 76,2% | +1,6 pp [+0,4; +2,8] · poprawa |
| max · 11B | 79,7% | 81,1% | +1,4 pp [+0,3; +2,5] · poprawa |
| Rzeczywiste polskie dokumenty158 pytań o dokumenty spoza danych treningowych | mini · 1.5B | 91,8% | 91,8% | 0,0 pp [−3,8; +3,8] · bez istotnej zmiany |
| 4.5B | 94,9% | 94,9% | 0,0 pp [−3,2; +3,2] · bez istotnej zmiany |
| max · 11B | 96,2% | 97,5% | +1,3 pp [−1,3; +3,8] · bez istotnej zmiany |
| Angielski zbiór testowy1 479 przypadków | mini · 1.5B | 59,4% | 60,5% | +1,1 pp [−0,7; +2,9] · bez istotnej zmiany |
| 4.5B | 64,3% | 64,4% | +0,1 pp [−1,7; +1,9] · bez istotnej zmiany |
| max · 11B | 66,1% | 67,3% | +1,1 pp [−0,6; +3,1] · bez istotnej zmiany |
| Panel angielski10 zadań; różnica i przedział na poziomie pytań | mini · 1.5B | 58,2% | 56,1% | −1,5 pp [−2,9; 0,0] · spadek |
| 4.5B | 68,8% | 65,2% | −3,6 pp [−5,3; −2,0] · spadek |
| max · 11B | 73,7% | 71,9% | −2,5 pp [−4,0; −1,0] · spadek |

JAK CZYTAĆ TE WYNIKI

### Lepsza kalibracja i wiedza ogólna. Nie każdy test idzie w górę.

Wszystkie trzy rozmiary zyskują w wiedzy ogólnej po polsku (+1,4 do +2,2 pkt). Na panelu angielskim wszystkie tracą (−1,5 do −3,6 pkt), a mini traci 1,4 pkt na polskich decyzjach. Pozostałe różnice mieszczą się w przedziałach niepewności. Przed zmianą wersji w działającym procesie sprawdź model na własnych danych.

05 / PEWNOŚĆ DECYZJI · 16.10.2026

## Ile decyzji można zautomatyzować?

[Pobierz analizę JSON ↓](https://basal.si5.pl/assets/benchmarks/werdykt-confidence.json)

Model wybiera odpowiedź i podaje jej prawdopodobieństwo. Ustalasz próg: decyzje o wyższej pewności przyjmujesz automatycznie, pozostałe kierujesz do człowieka. Sprawdzamy, jak dużo pracy przechodzi przez taki próg — i jaki błąd pozostaje wśród przyjętych decyzji.

1. 01 Model wybiera odpowiedź
2. 02 Sprawdzasz jej pewność
3. 03 Automatyzacja lub człowiek

BASAL-2.0 · CEL BŁĘDU: 5%**65,6%**

### decyzji przyjętych automatycznie

basal-2.0-max · zmierzony błąd: **4,51%**

BASAL-OMNI · CEL BŁĘDU: 5%**75,5%**

### decyzji przyjętych automatycznie

basal-omni-1.0-max · zmierzony błąd: **5,02%**

PEWNOŚĆ A TRAFNOŚĆ**87,7% → 82,3%**

### deklaracja modelu a wynik testu

basal-omni-1.0-max jest średnio zbyt pewny odpowiedzi. Wartość progu trzeba sprawdzić na danych własnego procesu.

**Cel nie jest gwarancją.** Próg dobrano na jednej połowie pytań, a odsetek automatyzacji i błąd zmierzono na drugiej. Dla celu 1% basal-2.0-max uzyskał błąd 1,34%, a basal-omni-1.0-max — 1,45%. Analiza obejmuje 94 systemów z aktualnego eksportu Werdyktu z 16 października 2026, w tym trzy modele basal-2.0 i dwa basal-omni. **To 5 000 pytań tekstowych PL+EN.** Wyniki nie określają kalibracji obrazów ani dźwięku.

Dla modelu głównego basal-2.0 próg dobrany do celu 5% przyjmuje **51,3%** decyzji, przy zmierzonym błędzie **5,08%**. Na wykresach domyślnie pokazujemy całą nową rodzinę i Jev; pozostałe systemy możesz włączyć poniżej.

Wybierz systemy na wykresach 

Kliknij nazwę, aby dodać lub ukryć serię. Wybór dotyczy obu wykresów.

Domyślny wybórWyczyść wybór

Nie wybrano systemu. Rozwiń „Wybierz systemy na wykresach” lub przywróć domyślny wybór.

01 / KALIBRACJA

### Czy pewności można zaufać?

Deklarowana pewność i rzeczywista trafność w 10 przedziałach. Punkty poniżej przekątnej oznaczają zawyżoną pewność. Większy punkt to więcej pytań.

Przesuń wykres w poziomie, aby zobaczyć całą skalę.


02 / AUTOMATYZACJA

### Ile pracy oddać modelowi?

Linie: trafność od najpewniejszych decyzji, na całym zbiorze. Znaczniki: osobny pomiar na połowie testowej, po dobraniu progu do celu 1% (○) lub 5% (□).

Przesuń wykres w poziomie, aby zobaczyć całą skalę.

Wskaż punkt, aby odczytać wartość. Z klawiatury: Tab wybiera serię, strzałki ← → zmieniają punkt. Wszystkie systemy i wyniki progów są również w tabeli.

Interaktywne wykresy wymagają JavaScript i pobrania danych. Pełne wyniki są dostępne w tabeli poniżej oraz w pliku JSON.

### Porównanie 94 systemów

W kolumnach celów: automatycznie przyjęte decyzje, zmierzony błąd i zastosowany próg. Mniejszy ECE, Brier i AURC oznacza lepszy wynik.

Znajdź system

94 systemów · domyślna kolejność według automatyzacji dla celu 5% · tabela przewija się poziomo.

Werdykt v1 · tekst PL+EN · eksport z 16 października 2026 · te same przebiegi co w głównym rankingu

| System / parametry | Trafność ↑ | Średnia pewność | ECE ↓ | Brier ↓ | AURC ↓ | Cel błędu: 1% Automatyzacja ↑ | Cel błędu: 5% Automatyzacja ↑ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Liquid d1-ultranie podano · APIAPI | 88,10% | 87,40% | 0,018 | 0,157 | 0,016 | **72,72%**Błąd: 1,25%Próg: 0,8753 | **88,08%**Błąd: 5,47%Próg: 0,5685 |
| basal-omni-1.0-ultra31B · otwarte wagibasal-serve · eager | 87,92% | 91,74% | 0,038 | 0,169 | 0,018 | **72,01%**Błąd: 1,37%Próg: 0,9479 | **87,72%**Błąd: 6,44%Próg: 0,7299 |
| René-1 31B FP831B · otwarte wagiSerwer modelu | 85,36% | 86,95% | 0,017 | 0,195 | 0,025 | **65,77%**Błąd: 1,38%Próg: 0,9300 | **81,52%**Błąd: 5,23%Próg: 0,6900 |
| pplx-decider-v1.1-27b (Decisions API)27B · APIAPI | 85,18% | 90,80% | 0,057 | 0,207 | 0,024 | **61,19%**Błąd: 1,03%Próg: 0,9922 | **81,25%**Błąd: 4,47%Próg: 0,8117 |
| Mercury Decide (OpenRouter Decisions API)nie podano · APIAPI | 84,48% | 92,94% | 0,085 | 0,233 | 0,029 | **57,95%**Błąd: 1,23%Próg: 0,9979 | **80,06%**Błąd: 4,93%Próg: 0,9442 |
| pplx-decider-v1-27b27B · otwarte wagiSerwer modelu | 81,80% | 80,02% | 0,043 | 0,248 | 0,030 | **60,56%**Błąd: 1,30%Próg: 0,8605 | **78,80%**Błąd: 4,86%Próg: 0,5460 |
| decisio v0.8.0 on gemma-4-31B-it31B · otwarte wagiSerwer modelu | 83,48% | 89,78% | 0,063 | 0,237 | 0,035 | **9,63%**Błąd: 0,82%Próg: 0,9955 | **76,94%**Błąd: 4,46%Próg: 0,8787 |
| deck-31B31B · otwarte wagiSerwer modelu | 83,54% | 94,11% | 0,106 | 0,259 | 0,035 | **45,08%**Błąd: 1,40%Próg: 0,9966 | **76,63%**Błąd: 4,33%Próg: 0,9656 |
| Jebadiah 27B27B · otwarte wagiSerwer modelu | 81,96% | 73,60% | 0,093 | 0,242 | 0,033 | **52,23%**Błąd: 1,13%Próg: 0,7978 | **76,35%**Błąd: 4,40%Próg: 0,5573 |
| basal-omni-1.0-max12B · otwarte wagibasal-serve · eager | 82,28% | 87,71% | 0,054 | 0,241 | 0,036 | **60,09%**Błąd: 1,45%Próg: 0,9665 | **75,52%**Błąd: 5,02%Próg: 0,8161 |
| Jev 1.14nie podano · APIAPI | 82,16% | 82,85% | 0,019 | 0,225 | 0,033 | **61,07%**Błąd: 1,36%Próg: 0,9000 | **74,97%**Błąd: 4,16%Próg: 0,6800 |
| Surogate Rune 26B-A4B v326B-A4B · otwarte wagisurogate · C++ | 81,68% | 82,09% | 0,024 | 0,240 | 0,038 | **50,93%**Błąd: 1,40%Próg: 0,9266 | **73,31%**Błąd: 5,12%Próg: 0,7146 |
| Jev 1.13.0— · APIAPI | 81,64% | 82,92% | 0,016 | 0,235 | 0,036 | **49,39%**Błąd: 1,04%Próg: 0,9700 | **72,84%**Błąd: 4,07%Próg: 0,7200 |
| basal-omni-1.1-max12B · otwarte wagibasal-serve 2.1 · eager | 82,06% | 87,20% | 0,051 | 0,245 | 0,037 | **57,68%**Błąd: 1,23%Próg: 0,9672 | **72,60%**Błąd: 4,40%Próg: 0,8432 |
| Eikos-27B-FP8 (v1.3)27B · otwarte wagiSerwer modelu | 82,12% | 84,11% | 0,060 | 0,246 | 0,037 | **51,72%**Błąd: 1,30%Próg: 0,9132 | **72,40%**Błąd: 4,80%Próg: 0,7902 |
| Respan Span-02 · endpoint z rozumowaniem26B MoE (4B active) · otwarte wagiendpoint Respan · rozumowanie dostawcy | 89,52% | 90,48% | 0,066 | 0,191 | 0,031 | **45,16%**Błąd: 1,66%Próg: 0,9908 | **72,17%**Błąd: 5,31%Próg: 0,9098 |
| Decider chat · Gemma-4-31B31B · otwarte wagiSerwer modelu | 82,46% | 75,83% | 0,093 | 0,248 | 0,041 | **15,16%**Błąd: 0,52%Próg: 0,9271 | **71,97%**Błąd: 4,22%Próg: 0,7118 |
| Bobcat Flash 1.226B-A4B · otwarte wagiSerwer modelu | 80,22% | 88,02% | 0,078 | 0,273 | 0,042 | **46,90%**Błąd: 0,93%Próg: 0,9930 | **71,46%**Błąd: 5,41%Próg: 0,8676 |
| Respan Span-02 · 300 ms26B MoE (4B active) · otwarte wagisilnik Respan · budżet 300 ms | 81,38% | 90,35% | 0,090 | 0,276 | 0,043 | **45,12%**Błąd: 1,57%Próg: 0,9909 | **70,67%**Błąd: 5,53%Próg: 0,9150 |
| Respan Span-02 · 750 ms26B MoE (4B active) · otwarte wagisilnik Respan · budżet 750 ms (auto) | 85,58% | 90,78% | 0,066 | 0,237 | 0,038 | **45,12%**Błąd: 1,57%Próg: 0,9909 | **70,67%**Błąd: 5,53%Próg: 0,9150 |
| Respan Span-02 · bez rozumowania26B MoE (4B active) · otwarte wagisilnik Respan · bez rozumowania | 80,24% | 89,34% | 0,091 | 0,279 | 0,044 | **45,12%**Błąd: 1,57%Próg: 0,9909 | **70,67%**Błąd: 5,53%Próg: 0,9150 |
| simple-jev · Qwen3.8-27B (featherless)27B · otwarte wagiSerwer modelu | 80,14% | 84,38% | 0,043 | 0,261 | 0,041 | **49,74%**Błąd: 1,03%Próg: 0,9825 | **70,04%**Błąd: 4,34%Próg: 0,7982 |
| Quyet-1.0-Large31.3B (30.7B text) · otwarte wagiSerwer modelu | 83,28% | 92,52% | 0,088 | 0,263 | 0,044 | **26,10%**Błąd: 2,12%Próg: 0,9973 | **69,96%**Błąd: 4,74%Próg: 0,9536 |
| Winnow-12B (Q8)12B · otwarte wagiSerwer modelu | 78,50% | 86,99% | 0,085 | 0,288 | 0,047 | **47,37%**Błąd: 1,50%Próg: 0,9857 | **69,80%**Błąd: 5,60%Próg: 0,9279 |
| Clef (OpenRouter Decisions API)27B · APIAPI | 80,76% | 85,42% | 0,047 | 0,262 | 0,045 | **19,23%**Błąd: 0,21%Próg: 0,9843 | **68,30%**Błąd: 3,99%Próg: 0,8580 |
| Liquid d1— · APIAPI | 80,78% | 86,01% | 0,054 | 0,262 | 0,044 | **29,41%**Błąd: 0,40%Próg: 0,9973 | **67,82%**Błąd: 3,84%Próg: 0,8797 |
| Xor 26B-A4B 1.026B-A4B · otwarte wagiSerwer modelu | 79,76% | 72,29% | 0,086 | 0,275 | 0,044 | **44,77%**Błąd: 0,53%Próg: 0,8152 | **67,67%**Błąd: 3,85%Próg: 0,6416 |
| Reflex 27B (Decision Index 0.2 build)27B · otwarte wagiSerwer modelu | 79,10% | 78,40% | 0,030 | 0,273 | 0,050 | **35,93%**Błąd: 1,10%Próg: 0,9568 | **67,39%**Błąd: 4,86%Próg: 0,7220 |
| decider-12b v212B · otwarte wagiSerwer modelu | 78,90% | 76,99% | 0,039 | 0,270 | 0,045 | **51,60%**Błąd: 1,45%Próg: 0,8543 | **66,88%**Błąd: 4,13%Próg: 0,7068 |
| Cygnet12B · otwarte wagiSerwer modelu | 78,52% | 81,42% | 0,045 | 0,283 | 0,049 | **45,83%**Błąd: 1,21%Próg: 0,9330 | **66,25%**Błąd: 4,59%Próg: 0,8015 |
| basal-1.5-max11B · otwarte wagiSGLang | 77,28% | 84,68% | 0,074 | 0,307 | 0,054 | **42,52%**Błąd: 0,93%Próg: 0,9861 | **65,61%**Błąd: 4,99%Próg: 0,8677 |
| basal-2.0-max11B · otwarte wagibasal v2.0.0 · fast | 78,40% | 82,57% | 0,044 | 0,286 | 0,053 | **35,33%**Błąd: 1,34%Próg: 0,9714 | **65,61%**Błąd: 4,51%Próg: 0,8146 |
| GPT-6 Luna Decisions— · APIAPI | 78,38% | 80,75% | 0,025 | 0,285 | 0,055 | **0,00%**Błąd: —Próg: — | **65,38%**Błąd: 5,62%Próg: 0,7800 |
| Microsoft-Decision-1 (OpenRouter Decisions API)nie podano · APIAPI | 80,02% | 88,65% | 0,087 | 0,285 | 0,051 | **27,71%**Błąd: 0,85%Próg: 0,9983 | **64,31%**Błąd: 4,05%Próg: 0,9345 |
| basal-omni-1.0-mini4B · otwarte wagibasal-serve · eager | 76,88% | 86,37% | 0,095 | 0,319 | 0,059 | **39,01%**Błąd: 1,52%Próg: 0,9900 | **63,76%**Błąd: 4,46%Próg: 0,9016 |
| decider-12b v112B · otwarte wagiSerwer modelu | 77,10% | 75,86% | 0,062 | 0,296 | 0,054 | **47,14%**Błąd: 1,42%Próg: 0,8607 | **63,60%**Błąd: 4,28%Próg: 0,7391 |
| JEVfire (Qwen3.8-27B-FP8)27B · otwarte wagiSerwer modelu | 77,74% | 79,58% | 0,024 | 0,292 | 0,057 | **35,10%**Błąd: 1,57%Próg: 0,9861 | **62,10%**Błąd: 4,51%Próg: 0,8176 |
| Xor 1.235B-A3B · otwarte wagiSerwer modelu | 77,22% | 78,86% | 0,029 | 0,299 | 0,058 | **27,95%**Błąd: 0,71%Próg: 0,9788 | **61,82%**Błąd: 4,21%Próg: 0,7695 |
| Jev-Omni12B · otwarte wagiSerwer modelu | 75,34% | 84,03% | 0,087 | 0,333 | 0,062 | **37,66%**Błąd: 0,52%Próg: 0,9936 | **60,76%**Błąd: 4,16%Próg: 0,9234 |
| H2O-Lightning-4B v1.14B · otwarte wagiSerwer modelu | 75,30% | 76,97% | 0,041 | 0,319 | 0,068 | **26,41%**Błąd: 0,75%Próg: 0,9479 | **57,17%**Błąd: 4,01%Próg: 0,8326 |
| Decider chat · Qwen3.6-27B27B · otwarte wagiSerwer modelu | 76,86% | 73,16% | 0,052 | 0,307 | 0,063 | **25,90%**Błąd: 0,76%Próg: 0,9109 | **56,81%**Błąd: 4,17%Próg: 0,7596 |
| JPT-9B9B · otwarte wagiSerwer modelu | 75,18% | 80,08% | 0,049 | 0,325 | 0,067 | **25,78%**Błąd: 0,46%Próg: 0,9761 | **55,39%**Błąd: 3,71%Próg: 0,8787 |
| djev26B (4B active) · otwarte wagiSerwer modelu | 69,80% | 84,34% | 0,105 | 0,448 | 0,087 | **9,83%**Błąd: 2,01%Próg: 0,9994 | **55,19%**Błąd: 5,72%Próg: 0,9263 |
| Solar Decide— · APIAPI | 81,32% | 92,32% | 0,110 | 0,296 | 0,064 | **0,00%**Błąd: —Próg: — | **54,52%**Błąd: 4,56%Próg: 0,9806 |
| sonda-1.0-4B4B · otwarte wagivLLM | 70,72% | 80,79% | 0,084 | 0,401 | 0,084 | **32,18%**Błąd: 1,72%Próg: 0,9904 | **52,74%**Błąd: 4,34%Próg: 0,9014 |
| basal-2.04.5B · otwarte wagibasal v2.0.0 · fast | 72,86% | 78,76% | 0,060 | 0,362 | 0,086 | **11,92%**Błąd: 0,66%Próg: 0,9872 | **51,28%**Błąd: 5,08%Próg: 0,8761 |
| Imajev-4B4B · otwarte wagiSerwer modelu | 68,16% | 76,60% | 0,039 | 0,476 | 0,097 | **6,24%**Błąd: 0,00%Próg: 0,9931 | **50,41%**Błąd: 4,62%Próg: 0,8078 |
| basal-1.54.5B · otwarte wagiSGLang | 72,12% | 78,91% | 0,068 | 0,371 | 0,088 | **22,46%**Błąd: 1,23%Próg: 0,9926 | **50,14%**Błąd: 5,04%Próg: 0,9164 |
| Decision 1.0 Lux 9B9B · otwarte wagiSerwer modelu | 74,94% | 77,00% | 0,022 | 0,331 | 0,077 | **13,26%**Błąd: 0,60%Próg: 0,9828 | **48,68%**Błąd: 4,62%Próg: 0,8681 |
| Hopper (G) 1.24B · otwarte wagiSerwer modelu | 71,10% | 75,58% | 0,070 | 0,374 | 0,089 | **23,96%**Błąd: 1,15%Próg: 0,9379 | **48,56%**Błąd: 3,82%Próg: 0,8699 |
| MedDecider-9B9.7B · otwarte wagiSerwer modelu | 73,28% | 71,52% | 0,025 | 0,341 | 0,080 | **29,21%**Błąd: 0,81%Próg: 0,9268 | **47,81%**Błąd: 4,54%Próg: 0,8154 |
| decider-4b v24B · otwarte wagiSerwer modelu | 70,00% | 73,31% | 0,038 | 0,375 | 0,095 | **25,23%**Błąd: 1,10%Próg: 0,9565 | **46,55%**Błąd: 4,24%Próg: 0,8476 |
| JPT-4B4B · otwarte wagiSerwer modelu | 71,14% | 78,36% | 0,072 | 0,376 | 0,093 | **2,01%**Błąd: 0,00%Próg: 0,9968 | **44,61%**Błąd: 3,45%Próg: 0,9254 |
| DREX v1.5 (OpenRouter Decisions API)nie podano · APIAPI | 74,88% | 86,19% | 0,113 | 0,363 | 0,084 | **0,00%**Błąd: —Próg: — | **44,49%**Błąd: 4,17%Próg: 0,9838 |
| Decision-2.0-Nox-4B4B (4.21B) · otwarte wagieager · H100 NVL | 71,64% | 68,89% | 0,032 | 0,362 | 0,092 | **21,95%**Błąd: 0,54%Próg: 0,9303 | **44,14%**Błąd: 4,20%Próg: 0,8079 |
| JevK5 v0.34B · otwarte wagiSerwer modelu | 68,86% | 76,41% | 0,075 | 0,404 | 0,107 | **13,50%**Błąd: 1,75%Próg: 0,9914 | **41,49%**Błąd: 4,38%Próg: 0,9029 |
| Clef Flash (OpenRouter Decisions API)9B · APIAPI | 71,60% | 77,88% | 0,063 | 0,383 | 0,099 | **13,26%**Błąd: 1,19%Próg: 0,9639 | **39,28%**Błąd: 4,22%Próg: 0,9212 |
| MedDecider-4B4.7B · otwarte wagiSerwer modelu | 68,90% | 69,73% | 0,020 | 0,385 | 0,104 | **17,17%**Błąd: 0,23%Próg: 0,9639 | **39,28%**Błąd: 3,82%Próg: 0,8562 |
| spark-s1-4b-v64B · otwarte wagiopen\_spark\_jev · HF | 69,38% | 85,34% | 0,160 | 0,453 | 0,107 | **24,52%**Błąd: 1,45%Próg: 0,9978 | **39,24%**Błąd: 3,62%Próg: 0,9921 |
| Clef-Flash9B · otwarte wagiSerwer modelu | 71,58% | 77,87% | 0,063 | 0,383 | 0,099 | **10,74%**Błąd: 0,37%Próg: 0,9675 | **39,01%**Błąd: 4,25%Próg: 0,9222 |
| jev-local (Qwen3.5-9B, HF scorer)9B · otwarte wagijevlocal · HF scorer | 62,18% | 59,15% | 0,090 | 0,550 | 0,132 | **20,69%**Błąd: 1,15%Próg: 0,8063 | **38,45%**Błąd: 5,03%Próg: 0,6658 |
| Tev1 4B Experimental4B · APIAPI | 68,62% | 78,62% | 0,100 | 0,410 | 0,111 | **13,46%**Błąd: 0,29%Próg: 0,9969 | **38,10%**Błąd: 5,18%Próg: 0,9599 |
| JevK5 v0.2 (4B)4B · otwarte wagijevk5-serve | 66,72% | 72,92% | 0,062 | 0,416 | 0,120 | **10,07%**Błąd: 0,39%Próg: 0,9883 | **37,47%**Błąd: 4,85%Próg: 0,9004 |
| Kev 4B (OpenRouter Decisions API)4B · APIAPI | 67,44% | 65,75% | 0,033 | 0,426 | 0,115 | **21,08%**Błąd: 1,50%Próg: 0,9119 | **37,19%**Błąd: 4,03%Próg: 0,7992 |
| Kev 1.0 (kev-4b)4B · otwarte wagikev.serve | 68,36% | 65,35% | 0,034 | 0,397 | 0,114 | **21,67%**Błąd: 1,46%Próg: 0,9100 | **36,72%**Błąd: 4,09%Próg: 0,8048 |
| Qwen3-32B, zero-shot (jqv)32B · otwarte wagiSerwer modelu | 70,54% | 71,64% | 0,039 | 0,385 | 0,103 | **17,33%**Błąd: 1,37%Próg: 0,9340 | **36,00%**Błąd: 4,28%Próg: 0,8569 |
| Decision 4B v1.24B · otwarte wagiSerwer modelu | 70,16% | 70,05% | 0,024 | 0,386 | 0,103 | **9,51%**Błąd: 0,41%Próg: 0,9738 | **35,61%**Błąd: 3,66%Próg: 0,8698 |
| Jet v6.24B · otwarte wagiSerwer modelu | 67,34% | 82,17% | 0,148 | 0,472 | 0,127 | **15,44%**Błąd: 1,79%Próg: 0,9640 | **35,37%**Błąd: 5,92%Próg: 0,9384 |
| Decision 4B v1.14B · otwarte wagiSerwer modelu | 69,02% | 71,49% | 0,025 | 0,397 | 0,110 | **13,11%**Błąd: 1,51%Próg: 0,9724 | **33,99%**Błąd: 3,37%Próg: 0,9043 |
| Plumb-4B4B · otwarte wagiSerwer modelu | 69,04% | 78,96% | 0,099 | 0,423 | 0,116 | **1,74%**Błąd: 0,00%Próg: 0,9969 | **33,87%**Błąd: 3,73%Próg: 0,9339 |
| Malkuth-4B4B · otwarte wagiSerwer modelu | 63,36% | 69,92% | 0,052 | 0,474 | 0,143 | **16,27%**Błąd: 1,46%Próg: 0,9664 | **32,49%**Błąd: 5,59%Próg: 0,8939 |
| basal-1.0 · 4.5B4.5B · otwarte wagibasal · fast | 66,04% | 72,74% | 0,070 | 0,446 | 0,139 | **17,02%**Błąd: 0,46%Próg: 0,9773 | **31,78%**Błąd: 4,72%Próg: 0,9098 |
| Hopper4B · otwarte wagiSerwer modelu | 70,28% | 70,12% | 0,059 | 0,395 | 0,111 | **7,30%**Błąd: 1,08%Próg: 0,9947 | **30,40%**Błąd: 3,77%Próg: 0,9291 |
| decider-35b-a3b NVFP435B-A3B · otwarte wagiSerwer modelu | 70,38% | 74,35% | 0,040 | 0,385 | 0,109 | **5,96%**Błąd: 1,32%Próg: 0,9973 | **30,20%**Błąd: 4,58%Próg: 0,9369 |
| sonda-1.1-4B4B · otwarte wagiSerwer modelu | 64,02% | 76,14% | 0,121 | 0,468 | 0,142 | **14,45%**Błąd: 1,91%Próg: 0,9869 | **30,16%**Błąd: 5,24%Próg: 0,9544 |
| Clef Omni (OpenRouter Decisions API)nie podano · APIAPI | 70,14% | 77,36% | 0,072 | 0,403 | 0,115 | **3,71%**Błąd: 1,06%Próg: 0,9744 | **26,02%**Błąd: 4,86%Próg: 0,9208 |
| basal-2.0-mini1.5B · otwarte wagibasal v2.0.0 · fast | 61,84% | 64,25% | 0,035 | 0,477 | 0,165 | **15,16%**Błąd: 1,82%Próg: 0,9138 | **25,42%**Błąd: 5,12%Próg: 0,8566 |
| SemIf4B · otwarte wagiSerwer modelu | 58,80% | 73,51% | 0,091 | 0,588 | 0,166 | **4,97%**Błąd: 0,79%Próg: 0,9989 | **24,83%**Błąd: 5,56%Próg: 0,9715 |
| local-jev (Qwen3.5-4B)4B · otwarte wagilocal-jev · HF | 62,98% | 64,27% | 0,020 | 0,458 | 0,158 | **4,30%**Błąd: 0,92%Próg: 0,9854 | **24,71%**Błąd: 6,39%Próg: 0,8895 |
| typecastlm v1.3.0 (Qwen3.5 3.8B)3.8B · otwarte wagitypecastlm · local | 62,88% | 62,03% | 0,067 | 0,459 | 0,151 | **10,34%**Błąd: 1,15%Próg: 0,8927 | **23,81%**Błąd: 5,14%Próg: 0,8223 |
| metask-jev-4b4B · otwarte wagiSerwer modelu | 61,16% | 73,71% | 0,066 | 0,572 | 0,151 | **9,59%**Błąd: 1,65%Próg: 0,9510 | **23,73%**Błąd: 4,99%Próg: 0,9196 |
| open-alternative-jev (so1, Qwen3.5-4B)4B · otwarte wagiso1 · HF + adapter HTTP | 60,24% | 73,66% | 0,134 | 0,528 | 0,182 | **7,86%**Błąd: 1,01%Próg: 0,9937 | **22,11%**Błąd: 5,18%Próg: 0,9677 |
| basal-1.5-mini1.5B · otwarte wagibasal · fast | 60,66% | 69,26% | 0,086 | 0,498 | 0,174 | **11,92%**Błąd: 1,66%Próg: 0,9846 | **21,87%**Błąd: 4,33%Próg: 0,9554 |
| Manchego v2.14B · otwarte wagiSerwer modelu | 63,04% | 74,95% | 0,119 | 0,502 | 0,178 | **3,91%**Błąd: 1,01%Próg: 0,9978 | **19,98%**Błąd: 3,95%Próg: 0,9577 |
| decider-2b (v11)2B · otwarte wagidecider-ai 1.8.1 | 58,66% | 70,99% | 0,123 | 0,538 | 0,204 | **9,79%**Błąd: 3,23%Próg: 0,9881 | **17,02%**Błąd: 5,57%Próg: 0,9649 |
| Solar Decide Flash— · APIAPI | 60,16% | 75,24% | 0,151 | 0,534 | 0,186 | **5,21%**Błąd: 0,00%Próg: 0,9968 | **16,66%**Błąd: 2,84%Próg: 0,9842 |
| Decision 2B (preview)2B · otwarte wagimodel.decide + adapter HTTP | 54,62% | 62,45% | 0,030 | 0,627 | 0,215 | **4,66%**Błąd: 0,85%Próg: 0,9574 | **16,27%**Błąd: 6,80%Próg: 0,8789 |
| lev4B · otwarte wagiSerwer modelu | 62,86% | 73,91% | 0,111 | 0,484 | 0,168 | **0,00%**Błąd: —Próg: — | **11,05%**Błąd: 3,93%Próg: 0,9746 |
| Nemotron Diffusion 8B (Nemotron\_Jev)8B · otwarte wagiNemotron\_Jev · vLLM | 51,54% | 66,62% | 0,151 | 0,620 | 0,276 | **4,66%**Błąd: 2,54%Próg: 0,9931 | **10,03%**Błąd: 7,87%Próg: 0,9772 |
| basal-1.0 · 1.5B1.5B · otwarte wagibasal · fast | 52,24% | 63,65% | 0,114 | 0,601 | 0,289 | **0,00%**Błąd: —Próg: — | **5,53%**Błąd: 6,43%Próg: 0,9820 |
| Malkuth-2B2B · otwarte wagikev.serve | 49,98% | 64,45% | 0,134 | 0,644 | 0,302 | **0,00%**Błąd: —Próg: — | **2,80%**Błąd: 2,82%Próg: 0,9909 |
| Certo v10.4B · otwarte wagicerto · adapter HTTP | 28,26% | 29,71% | 0,017 | 0,730 | 0,616 | **0,00%**Błąd: —Próg: — | **0,00%**Błąd: —Próg: — |
| JEV-Qwen3.5-9B-Base-NVFP49B · otwarte wagiSGLang · NVFP4 + adapter HTTP | 57,26% | 63,32% | 0,061 | 0,539 | 0,235 | **0,00%**Błąd: —Próg: — | **0,00%**Błąd: —Próg: — |
| Qwen3-Reranker-4B (as a decider)4B · otwarte wagiTransformers · adapter rerankera | 47,20% | 33,67% | 0,137 | 0,669 | 0,414 | **0,00%**Błąd: —Próg: — | **0,00%**Błąd: —Próg: — |

**Jak czytać cel 1% i 5%.** Progi wybieramy na jednej połowie pytań, według stałego podziału opartego na skrócie identyfikatora. Następnie stosujemy je do drugiej połowy. „Automatyzacja” to odsetek przyjętych decyzji na tej drugiej części; „Błąd” to błędne odpowiedzi wśród przyjętych. Wynik może przekroczyć założony cel. Znak „—” oznacza brak wyznaczonego progu lub brak przyjętych decyzji, dla których można zmierzyć błąd.

**Pewność i zakres porównania.** Pewność to najwyższe prawdopodobieństwo odpowiedzi zwrócone przez system. Analiza obejmuje 94 systemów z blokiem kalibracji w aktualnym eksporcie Werdyktu. Pomijamy przebiegi bez takich danych, w tym GPT, Gemini i Claude, które zwracały w tym protokole wybraną odpowiedź bez porównywalnego rozkładu prawdopodobieństw.

**ECE, Brier i AURC.** ECE to średnia ważona bezwzględnej różnicy między pewnością a trafnością w 10 przedziałach równej szerokości. Brier mierzy błąd całego rozkładu prawdopodobieństw odpowiedzi (wariant wieloklasowy). AURC to pole pod krzywą błędu względem odsetka przyjętych decyzji — ocenia, czy pewność dobrze szereguje odpowiedzi od najbardziej do najmniej wiarygodnych.

**Krzywe a pomiar progów.** Krzywe kalibracji i trafności opisują cały zbiór. Na wykresie automatyzacji znaczniki 1% i 5% pokazują faktyczny odsetek i trafność z osobnej połowy testowej; nie muszą leżeć na linii całego zbioru. Nieudane wywołanie nigdy nie jest przyjmowane automatycznie i liczy się jako błąd w trafności całego testu. Przedziały kalibracji obejmują odpowiedzi z dostępnymi prawdopodobieństwami.

**Warunki basal.** Wyniki pochodzą z tych samych przebiegów co główny ranking: basal-2.0 korzysta z silnika fast, basal-omni z eager; BF16 i kalibracja włączona, odpowiedzi w trybie `--deterministic`. Historyczne modele pozostają punktami odniesienia, z silnikiem podanym przy nazwie. Wyznaczone tu progi są analizą Werdyktu, a nie gotowymi ustawieniami `max_error` dla dowolnego procesu. Publikujemy wyłącznie agregaty, bez pytań i dokumentów testowych.

WARUNKI POMIARÓW

## Co dokładnie mierzy Werdykt?

Wynik dotyczy wyboru odpowiedzi z podanych opcji. Nie jest oceną całego produktu ani gwarancją poprawności w nowym procesie.

Ten sam problem, jedno wywołanie

Każdy system otrzymuje ten sam stan, pytanie i opcje. Modele czatowe dostają wspólny, ustalony prompt z odpowiedzią JSON; serwery decyzyjne — równoważne pola System One. Nieodczytana odpowiedź i wywołanie zakończone błędem liczą się jako błąd.

Trafność i niepewność

Główny wynik to średnia trafności z 20 grup: 10 kategorii × polski i angielski, po 250 pytań. Przedziały 95% wyznaczono przez bootstrap warstwowy: 1 000 losowań wewnątrz każdej grupy. Przedział w tabeli dotyczy wyłącznie wyniku PL + EN, także po zmianie filtra.

Czas, sprzęt i koszt

Mediana i p95: 200 wspólnych pytań, pojedyncze zapytania bez kolejki. Większość otwartych modeli działa na jednym H100 80 GB, Nox na H100 NVL 94 GB, a kilka systemów, oznaczonych w tabeli, na RTX PRO 6000 Blackwell 96 GB. Klient działa przy serwerze. Koszt H100 i H100 NVL wyliczamy przy 3,95 USD/h, Blackwell przy 2,09 USD/h. Czas API obejmuje sieć do dostawcy. Przepustowość dla modeli lokalnych mierzona przy 16 równoległych zapytaniach. Modelom API pozostawiono ustawienie rozumowania podane w tabeli; Jev korzysta ze swojego API.

basal zawsze stosuje kalibrację. basal-1.0 i basal-1.5 oceniają obie kolejności opcji, basal-2.0 jedną, domyślną dla swojego formatu zapytania. W tej tabeli basal-1.5 4.5B i max działają przez SGLang; ich mediany w trybie fast wyniosły odpowiednio 31,2 i 44,7 ms. basal-2.0 działa na silniku basal v2.0.0 w trybie fast.

Zamknięty zbiór i jawne przykłady

Ukrytych pytań nie publikujemy. Żadne pytanie, dokument ani fragment Werdyktu nie występuje w danych treningowych basal. Poniższe przykłady są osobnymi, syntetycznymi ilustracjami napisanymi na potrzeby tej strony. Nie zawierają fragmentów dokumentów źródłowych i nie służyły do wyliczenia rankingu. Przy kolejnej wersji benchmarku planowana jest wymiana około 30% każdej grupy oraz raportowanie wyników na zachowanej części.

PRZYKŁADY SYNTETYCZNE / 30 SCENARIUSZY

## Jak wyglądają takie decyzje?

Po trzy fikcyjne scenariusze na kategorię, w języku polskim i angielskim. Przygotowaliśmy je od podstaw na potrzeby tej strony, bez kopiowania dokumentów źródłowych. Osoby i organizacje zastępują oznaczenia ról, np. „Klient A”. Te przykłady ilustrują zadania i nie służyły do wyliczenia rankingu.

Brak wystarczających danych 3 przykłady1 · PL · Ile sztuk produktu B można przeznaczyć na nowe zamówienie?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjny rejestr magazynu. Produkt A: 18 sztuk na stanie, 7 zarezerwowanych. Produkt B: 9 sztuk na stanie. Rejestr nie podaje liczby rezerwacji produktu B. Towar dostępny do nowego zamówienia to stan pomniejszony o rezerwacje.

#### Możliwe odpowiedzi

* 9 sztuk
* 2 sztuki
* Nie da się ustalić na podstawie rejestru

**Odpowiedź wzorcowa:** Nie da się ustalić na podstawie rejestru

2 · EN · Who is assigned to the afternoon shift?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic handover log. Operator A covers the morning shift. Operator B has requested an exchange with Operator C for the afternoon shift. A request becomes effective only after approval by the shift lead. The log includes no approval and does not identify the original afternoon operator.

#### Możliwe odpowiedzi

* Operator B
* Operator C
* The log does not establish the assignment

**Odpowiedź wzorcowa:** The log does not establish the assignment

3 · PL · Jaki limit czasu pracy obowiązuje według podanych dokumentów?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Demonstracyjna specyfikacja urządzenia. Projekt dokumentu podaje limit 8 godzin pracy. Zatwierdzona wersja dokumentu podaje limit 6 godzin. Instrukcja procesu mówi, że wersja zatwierdzona zastępuje projekt.

#### Możliwe odpowiedzi

* 6 godzin
* 8 godzin
* Nie da się ustalić

**Odpowiedź wzorcowa:** 6 godzin

Następny krok agenta 3 przykłady1 · PL · Jaki powinien być następny krok agenta?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Symulacja obsługi zgłoszenia. Procedura: najpierw sprawdź kompletność, następnie zweryfikuj uprawnienie, a na końcu zaproponuj rozwiązanie. Stan procesu: kompletność potwierdzona; uprawnienie jeszcze niesprawdzone. Dostępne narzędzia: sprawdź kompletność, sprawdź uprawnienie, przygotuj propozycję, zamknij zgłoszenie.

#### Możliwe odpowiedzi

* Sprawdź uprawnienie
* Przygotuj propozycję
* Zamknij zgłoszenie

**Odpowiedź wzorcowa:** Sprawdź uprawnienie

2 · EN · Which action is allowed next?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic deployment exercise. Policy: a release may reach the staging environment only after both the build and automated checks pass. Production additionally requires an explicit approval. Current state: build passed, checks passed, staging not started, production approval absent.

#### Możliwe odpowiedzi

* Deploy to staging
* Deploy directly to production
* Skip the remaining steps

**Odpowiedź wzorcowa:** Deploy to staging

3 · PL · Co powinien teraz zrobić agent?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjne wywołanie usługi zwróciło kod 429 i nagłówek Retry-After: 20. Procedura pozwala na najwyżej trzy próby i wymaga odczekania czasu z nagłówka. Zakończyła się pierwsza próba; operacja jest bezpieczna do ponowienia.

#### Możliwe odpowiedzi

* Ponowić natychmiast
* Odczekać 20 sekund i ponowić
* Uznać operację za zakończoną sukcesem

**Odpowiedź wzorcowa:** Odczekać 20 sekund i ponowić

Umowy 3 przykłady1 · PL · Jaką obniżkę przewidują podane warunki?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Umowa demonstracyjna: miesięczna opłata za usługę wynosi 200 punktów rozliczeniowych. Jeśli miesięczna dostępność spadnie poniżej 99%, przysługuje obniżka równa 10% tej opłaty. W badanym miesiącu dostępność wyniosła 98,5%. Innych obniżek nie przewidziano.

#### Możliwe odpowiedzi

* 0 punktów
* 20 punktów
* 100 punktów

**Odpowiedź wzorcowa:** 20 punktów

2 · EN · Is the proposed task permitted by the stated agreement?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fictional service agreement. The supplier may use Subcontractor A for storage only. Access to message content requires separate written permission. No such permission has been granted. The proposed task is to let Subcontractor A read messages to prepare summaries.

#### Możliwe odpowiedzi

* Yes, storage permission includes reading
* No, separate permission is required
* Yes, if the summaries are short

**Odpowiedź wzorcowa:** No, separate permission is required

3 · PL · Jaka dopłata wynika z tej umowy?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjna umowa wypożyczenia: podstawowy pakiet obejmuje 4 dni. Każdy rozpoczęty dodatkowy dzień kosztuje 15 punktów. Sprzęt pozostawał u odbiorcy przez 6 pełnych dni. Nie ma okresu bezpłatnego ani innych dopłat.

#### Możliwe odpowiedzi

* 15 punktów
* 30 punktów
* 90 punktów

**Odpowiedź wzorcowa:** 30 punktów

Ocena odpowiedzi 3 przykłady1 · EN · How should the candidate answer be assessed?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic reference: Plan A permits three devices and includes email support. It does not include telephone support. User question: how many devices are allowed and is telephone support included? Candidate answer: three devices are allowed and telephone support is included.

#### Możliwe odpowiedzi

* Fully correct
* Partly correct: the support claim is wrong
* Unsupported in every part

**Odpowiedź wzorcowa:** Partly correct: the support claim is wrong

2 · PL · Która odpowiedź obejmuje wszystkie wymagane czynności?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjna instrukcja: przy przeniesieniu projektu zachowaj jego nazwę, wskaż nowy katalog i wykonaj kopię zapasową. Pytanie dotyczy wszystkich wymaganych czynności. Odpowiedź A wymienia trzy czynności. Odpowiedź B wymienia zachowanie nazwy i wskazanie katalogu, lecz pomija kopię zapasową.

#### Możliwe odpowiedzi

* Odpowiedź A
* Odpowiedź B
* Obie odpowiedzi

**Odpowiedź wzorcowa:** Odpowiedź A

3 · EN · What is the main issue with the summary?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic reference: a completed form must contain a project code, a purpose and a requested amount. Candidate summary: the form needs a project code and a purpose. The summary makes no other claims.

#### Możliwe odpowiedzi

* It adds an unsupported requirement
* It omits the requested amount
* It contradicts the project code requirement

**Odpowiedź wzorcowa:** It omits the requested amount

Długie dokumenty 3 przykłady

Przykłady są skróconymi, fikcyjnymi pakietami. Dokumenty w tej kategorii benchmarku mają 3–10 tys. tokenów.

1 · PL · Czy można już uruchomić urządzenie B?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Skrócony, syntetyczny pakiet dokumentów.  
  
Sekcja 1 — plan: test urządzenia A ma zakończyć się przed uruchomieniem urządzenia B. Zespół 1 odpowiada za test, Zespół 2 za uruchomienie.  
  
Sekcja 2 — sprawa poboczna: urządzenie C przeszło test i otrzymało zgodę na pracę. Ta zgoda dotyczy wyłącznie C.  
  
Sekcja 3 — raport: dla urządzenia A wykonano pomiary, lecz brakuje podpisu osoby zatwierdzającej. W tym procesie test uznaje się za zakończony dopiero po zatwierdzeniu.  
  
Sekcja 4 — kolejność: Zespół 2 czeka na potwierdzenie zakończenia testu A. Nie wydano wyjątku od tej zasady.

#### Możliwe odpowiedzi

* Tak, ponieważ urządzenie C ma zgodę
* Tak, same pomiary wystarczą
* Nie, test A nie został zatwierdzony

**Odpowiedź wzorcowa:** Nie, test A nie został zatwierdzony

2 · EN · Can the request for Project A be approved?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Short synthetic case file.  
  
Section 1 — request: Project A needs 12 units of Material X.  
  
Section 2 — warehouse: 20 units of Material X are stored, of which 6 are reserved for Project B. Reservations cannot be reassigned.  
  
Section 3 — unrelated shipment: 30 units of Material Y arrive tomorrow. They cannot substitute for Material X.  
  
Section 4 — rule: approve a request only if enough unreserved units of the requested material are available now.

#### Możliwe odpowiedzi

* Yes, 14 unreserved units of Material X are available
* No, only 6 units are available
* Only after the Material Y shipment arrives

**Odpowiedź wzorcowa:** Yes, 14 unreserved units of Material X are available

3 · PL · Jaki status wynika z procedury dla bieżącego alertu?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Skrócony, syntetyczny raport serwisowy.  
  
Część A — procedura: alert jest zakończony dopiero po naprawie i pomyślnym teście kontrolnym.  
  
Część B — archiwum: poprzedni alert dla modułu A został zakończony po teście. Ten wpis dotyczy wcześniejszego zdarzenia.  
  
Część C — bieżące zdarzenie: wymieniono uszkodzony element modułu A; test kontrolny nowej naprawy nie został jeszcze uruchomiony.  
  
Część D — notatka przekazania: zespół kolejnej zmiany ma wykonać brakujący test.

#### Możliwe odpowiedzi

* Zakończony
* Oczekuje na test kontrolny
* Nie wymaga żadnego działania

**Odpowiedź wzorcowa:** Oczekuje na test kontrolny

Rzeczywiste dokumenty 3 przykłady

W tej sekcji pokazujemy dokumenty fikcyjne. Ilustrują typ pytań; właściwy benchmark korzysta w tej kategorii z dokumentów rzeczywistych.

1 · EN · Which submission method does this document specify?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic document written for this demonstration; it is not an official notice.  
  
Notice from Organisation A: applications for the fictional equipment programme are accepted electronically only. A submission consists of a completed form and an inventory list. A telephone call does not count as a submission.

#### Możliwe odpowiedzi

* Telephone only
* Electronic submission with the required attachments
* Any method without attachments

**Odpowiedź wzorcowa:** Electronic submission with the required attachments

2 · PL · Jaką informację trzeba wpisać do rejestru przy pobraniu sprzętu?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Syntetyczny dokument demonstracyjny; nie jest to dokument urzędowy.  
  
Komunikat Organizacji A: magazyn demonstracyjny jest dostępny dla zespołów projektu od godziny 8:00 do 16:00. Pobranie sprzętu wymaga wpisania kodu projektu do rejestru. Pracownik dyżurny sprawdza zgodność kodu, ale nie zmienia godzin dostępu.

#### Możliwe odpowiedzi

* Kod projektu
* Prywatny adres pracownika
* Numer dokumentu tożsamości

**Odpowiedź wzorcowa:** Kod projektu

3 · EN · Which request has been accepted?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic document written for this demonstration; it is not a legal decision.  
  
Decision record of Organisation A: the request to expand the test area is accepted for two workstations. The separate request to expand the storage area remains pending because a floor plan is missing. The record makes no decision about opening hours.

#### Możliwe odpowiedzi

* Expansion of the storage area
* Expansion of the test area for two workstations
* A change to opening hours

**Odpowiedź wzorcowa:** Expansion of the test area for two workstations

Wyszukiwanie i RAG 3 przykłady1 · EN · Which passage directly answers the user question?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic knowledge snippets.  
Passage A: a project owner can export reports from the Reports menu.  
Passage B: account passwords are changed from Security settings.  
Passage C: billing history is visible to the billing role.  
User question: where can a project owner export a report?

#### Możliwe odpowiedzi

* Passage A
* Passage B
* Passage C

**Odpowiedź wzorcowa:** Passage A

2 · PL · Czy zebrany kontekst wystarcza do odpowiedzi na pytanie użytkownika?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Syntetyczny fragment bazy wiedzy: zadania ukończone można archiwizować. Archiwizacja zachowuje historię komentarzy.  
Pytanie użytkownika: czy zarchiwizowane zadanie da się przywrócić? W zebranym materiale nie opisano przywracania.

#### Możliwe odpowiedzi

* Tak, można potwierdzić przywracanie
* Tak, można wykluczyć przywracanie
* Nie, potrzebny jest fragment o przywracaniu

**Odpowiedź wzorcowa:** Nie, potrzebny jest fragment o przywracaniu

3 · EN · How does the claim relate to the source?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic source: notifications can be paused for one hour, four hours or until the next day. Pausing does not delete existing notifications.  
Claim to check: pausing notifications deletes all earlier notifications.

#### Możliwe odpowiedzi

* Supported
* Contradicted
* Not addressed

**Odpowiedź wzorcowa:** Contradicted

Kierowanie zgłoszeń 3 przykłady1 · EN · Which queue should receive the message?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fictional support rules: login failures go to Account Access; questions about charges go to Billing; requests for new capabilities go to Product Feedback. Message from Customer A: I know my password, but the verification code never arrives and I cannot sign in.

#### Możliwe odpowiedzi

* Account Access
* Billing
* Product Feedback

**Odpowiedź wzorcowa:** Account Access

2 · PL · Do jakiej kolejki skierować główną prośbę?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjna procedura: brak możliwości zapłaty kierujemy do Płatności, brak przesyłki do Dostawy, a pytania o parametry do Informacji o produkcie. Wiadomość Klienta A: parametry są jasne, chcę kupić produkt, lecz każda próba opłacenia koszyka kończy się błędem.

#### Możliwe odpowiedzi

* Płatności
* Dostawy
* Informacje o produkcie

**Odpowiedź wzorcowa:** Płatności

3 · EN · Which priority follows from this policy?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fictional priority policy: service unavailable for all users = urgent; unavailable for one team without a workaround = high; cosmetic issue with a workaround = normal. Report: one team cannot use the export function and no workaround exists. Other teams can use it.

#### Możliwe odpowiedzi

* Urgent
* High
* Normal

**Odpowiedź wzorcowa:** High

Reguły i terminy 3 przykłady1 · PL · Jaki koszt dostawy wynika z tych zasad?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjny cennik: dostawa standardowa kosztuje 10 punktów. Jest bezpłatna, gdy wartość produktów po rabatach wynosi co najmniej 100 punktów. Klient A wybrał dostawę standardową. Produkty kosztują 120 punktów przed rabatem wynoszącym 25%.

#### Możliwe odpowiedzi

* 0 punktów
* 10 punktów
* 25 punktów

**Odpowiedź wzorcowa:** 10 punktów

2 · EN · Is the pass valid on the immediately following Friday?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fictional access rule: a temporary pass is valid for the three calendar days after the day it is issued. The issue day is excluded. A pass was issued on a Monday. There are no exceptions.

#### Możliwe odpowiedzi

* Yes
* No
* The issue hour is required to decide

**Odpowiedź wzorcowa:** No

3 · PL · Czy zadanie A spełnia warunki automatycznego przydzielenia?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Reguły demonstracyjne: zadanie zostaje automatycznie przydzielone tylko wtedy, gdy ma opiekuna i co najmniej dwie niezależne akceptacje. Zadanie A ma opiekuna, jedną akceptację i jeden komentarz bez akceptacji.

#### Możliwe odpowiedzi

* Tak
* Nie, brakuje drugiej akceptacji
* Nie, brakuje opiekuna

**Odpowiedź wzorcowa:** Nie, brakuje drugiej akceptacji

Ocena na skali 3 przykłady1 · PL · Który poziom skali pasuje do opisu?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fikcyjna skala wpływu: 0 — brak utrudnienia; 1 — niewielkie utrudnienie z obejściem; 2 — zadanie zablokowane dla jednego zespołu; 3 — podstawowa usługa zablokowana dla wszystkich. Zespół A nie może ukończyć zadania i nie ma obejścia. Pozostałe zespoły pracują normalnie.

#### Możliwe odpowiedzi

* 0 — brak utrudnienia
* 1 — niewielkie utrudnienie
* 2 — blokada jednego zespołu
* 3 — blokada wszystkich

**Odpowiedź wzorcowa:** 2 — blokada jednego zespołu

2 · EN · Which completeness level applies?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Synthetic completeness rubric: 0 = none of the required fields; 1 = one field; 2 = two fields; 3 = all three fields. Required fields are purpose, project code and requested amount. The form contains a purpose and a project code, but no amount.

#### Możliwe odpowiedzi

* 0
* 1
* 2
* 3

**Odpowiedź wzorcowa:** 2

3 · EN · What relevance level fits the passage?

Przykład syntetyczny · tekst przygotowany na potrzeby tej strony.

Fictional relevance scale: low = unrelated topic; medium = same topic without answering the question; high = directly answers the question. Question: how can notifications be paused? Candidate passage: open Notification Settings and choose Pause, then select a duration.

#### Możliwe odpowiedzi

* Low
* Medium
* High

**Odpowiedź wzorcowa:** High

Wyniki poprzedniego wydania i metodologia: [Raport techniczny basal-1.0 ↗](https://github.com/rkinas/basal/blob/3fa2eeab2132665f6acd29c1bfa83f10448fd5d0/docs/basal-1.pdf)

[Zobacz modele w zastosowaniach →](https://basal.si5.pl/basal-lab/)
