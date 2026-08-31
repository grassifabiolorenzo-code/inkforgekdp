# Creator Studio Suite

OP+studioKdp — SaaS Platform

Costruisci una piattaforma SaaS completa chiamata OP+studioKdp.

Il prodotto deve essere progettato per essere venduto tramite abbonamento mensile utilizzando Lemon Squeezy.

I miei 4 tool saranno forniti/integrati nel progetto e rappresentano il cuore della piattaforma.

L'obiettivo è creare un SaaS moderno, premium, veloce e pronto per essere commercializzato.

1. BRAND

Nome del prodotto:

OP+studioKdp

Il brand deve avere un'identità tecnologica, moderna e premium.

Direzione visuale

Utilizza un'interfaccia:

dark;

elegante;

moderna;

futuristica ma professionale;

minimal;

orientata a creator e professionisti;

con ottima leggibilità.

Colori

Sfondo principale:

Dark / quasi nero

Utilizza sfumature e gradienti di:

viola elettrico;

verde brillante/accattivante.

I gradienti devono essere utilizzati soprattutto per:

CTA;

elementi evidenziati;

badge;

hover;

icone;

elementi decorativi;

grafici;

card premium.

Evita di rendere l'interfaccia eccessivamente colorata.

Il dark deve rimanere il colore dominante.

2. STRUTTURA DEL PRODOTTO

Il sito deve avere una parte pubblica e una parte privata.

Pagine pubbliche

Home

Pricing

FAQ

Login

Registrazione

Privacy Policy

Terms & Conditions

Area privata

Dashboard

Tool 1

Tool 2

Tool 3

Tool 4

Abbonamento

Profilo

Impostazioni

3. LANDING PAGE

Crea una landing page altamente professionale e orientata alla conversione.

Hero

Mostra:

OP+studioKdp

Headline principale orientata al valore della piattaforma.

Utilizza un testo placeholder iniziale che possa essere modificato facilmente.

CTA primaria:

"Inizia ora"

CTA secondaria:

"Scopri i piani"

La hero deve avere un effetto visivo moderno con:

gradienti viola/verde;

glow molto discreto;

preview della dashboard;

animazioni leggere.

Non utilizzare animazioni eccessive.

4. SEZIONE DEI 4 TOOL

La landing page deve presentare chiaramente i quattro strumenti.

Per ora utilizza:

Tool 1

Tool 2

Tool 3

Tool 4

Quando fornirò i miei tool, sostituire questi placeholder con i nomi, descrizioni e funzionalità reali.

Ogni tool deve avere:

icona;

nome;

descrizione;

breve spiegazione del vantaggio;

pulsante "Scopri di più".

Tutti e quattro i tool devono essere disponibili nei tre piani.

5. PRICING

Crea esattamente 3 piani mensili.

STARTER

€15 / mese

Accesso:

Tutti e 4 i tool

Limite:

50 utilizzi al mese

Bonus primo mese

Solo durante il primo mese dell'abbonamento:

+50 utilizzi gratuiti

Quindi il primo mese l'utente Starter dispone di:

100 utilizzi totali

Dal secondo mese torna automaticamente a:

50 utilizzi/mese

IMPORTANTE:

Il bonus di +50 utilizzi deve essere applicato una sola volta, durante il primo mese del primo abbonamento.

Non deve essere riapplicato automaticamente nei mesi successivi.

Se l'utente cancella e successivamente riattiva l'abbonamento, non deve ricevere nuovamente il bonus iniziale, salvo che io modifichi esplicitamente questa regola.

PRO

€20 / mese

Accesso:

Tutti e 4 i tool

Limite:

250 utilizzi al mese

Questo deve essere il piano consigliato.

Mostralo graficamente con un badge:

PIÙ SCELTO

Deve avere maggiore enfasi visiva rispetto agli altri piani.

BUSINESS

€25 / mese

Accesso:

Tutti e 4 i tool

Limite:

Utilizzo illimitato

Mostra chiaramente:

UTILIZZO ILLIMITATO

Questo piano deve essere percepito come il piano premium.

6. TABELLA COMPARATIVA

Crea una tabella di confronto chiara:

StarterProBusinessPrezzo€15/mese€20/mese€25/meseTool 1✓✓✓Tool 2✓✓✓Tool 3✓✓✓Tool 4✓✓✓Utilizzi/mese50250IllimitatiBonus primo mese+50——

Rendi il confronto perfettamente leggibile anche su smartphone.

7. LEMON SQUEEZY

Il sistema di pagamento deve essere progettato specificamente per Lemon Squeezy.

Non utilizzare Stripe come sistema principale.

Lemon Squeezy deve essere la piattaforma utilizzata per:

checkout;

pagamenti;

abbonamenti ricorrenti;

rinnovi;

gestione dello stato dell'abbonamento;

cancellazioni;

eventuali upgrade/downgrade.

Prepara l'applicazione per utilizzare i checkout/subscription di Lemon Squeezy.

I tre piani devono essere associati a tre prodotti/varianti Lemon Squeezy distinti.

Utilizza placeholder configurabili per:

STARTER_VARIANT_ID

PRO_VARIANT_ID

BUSINESS_VARIANT_ID

LEMON_SQUEEZY_STORE_ID

LEMON_SQUEEZY_API_KEY

LEMON_SQUEEZY_WEBHOOK_SECRET

NON inserire API key direttamente nel frontend.

Le chiavi private devono essere gestite tramite variabili d'ambiente/server-side.

8. WEBHOOK LEMON SQUEEZY

Implementa una struttura backend per ricevere e verificare i webhook di Lemon Squeezy.

Il sistema deve poter gestire almeno:

subscription_created;

subscription_updated;

subscription_cancelled;

subscription_resumed;

subscription_expired;

subscription_payment_success;

subscription_payment_failed.

Quando Lemon Squeezy comunica un cambiamento dello stato dell'abbonamento:

verifica la firma del webhook;

identifica l'utente;

identifica il piano;

aggiorna il database;

aggiorna i limiti di utilizzo;

aggiorna lo stato dell'account.

NON affidarti al frontend per determinare se l'abbonamento è attivo.

9. DATABASE

Prevedi almeno queste tabelle.

users

id

email

name

avatar

created_at

updated_at

plans

id

name

slug

price

monthly_limit

unlimited

lemon_squeezy_variant_id

active

Configurazione iniziale:

Starter:

price = 15

monthly_limit = 50

unlimited = false

Pro:

price = 20

monthly_limit = 250

unlimited = false

Business:

price = 25

monthly_limit = null

unlimited = true

subscriptions

id

user_id

plan_id

lemon_squeezy_subscription_id

lemon_squeezy_customer_id

status

current_period_start

current_period_end

cancelled_at

created_at

updated_at

usage

Registra l'utilizzo dei tool.

Campi:

id

user_id

tool_id

subscription_id

usage_count

period_start

period_end

created_at

updated_at

10. SISTEMA DI UTILIZZO

L'utilizzo deve essere calcolato a livello account.

Per Starter:

50 utilizzi/mese.

Durante il primo mese:

50 + 50 bonus = 100 utilizzi.

Per Pro:

250 utilizzi/mese.

Per Business:

nessun limite.

Il sistema deve mostrare all'utente:

Utilizzi questo mese

esempio:

37 / 50

e una progress bar.

Per Business mostra:

Utilizzo illimitato

11. BONUS STARTER

Implementa una logica specifica per il bonus iniziale.

Quando un utente sottoscrive Starter per la prima volta:

monthly_limit = 50

initial_bonus = 50

total_limit_first_month = 100

Dal secondo periodo:

total_limit = 50

Memorizza nel database un flag che permetta di sapere se il bonus è già stato utilizzato.

Esempio:

starter_bonus_used

Questo impedisce che il bonus venga assegnato più volte.

La logica deve essere server-side.

12. CONTROLLO UTILIZZI

Prima di eseguire qualsiasi tool:

verifica autenticazione;

verifica abbonamento attivo;

recupera il piano;

controlla il limite;

se il limite è disponibile, consenti l'utilizzo;

registra l'utilizzo;

aggiorna il contatore.

IMPORTANTE:

Il controllo deve essere eseguito lato server/backend.

Non deve essere possibile aggirare il limite modificando il frontend.

13. COMPORTAMENTO QUANDO IL LIMITE È RAGGIUNTO

Se Starter raggiunge 50/50:

mostra:

Hai raggiunto il limite mensile del piano Starter.

CTA:

Passa a Pro

Se Pro raggiunge 250/250:

mostra:

Hai raggiunto il limite mensile del piano Pro.

CTA:

Passa a Business

Business non deve mostrare un blocco per limite di utilizzo.

14. DASHBOARD

La dashboard deve essere il centro dell'applicazione.

Layout:

Sidebar

Logo:

OP+studioKdp

Menu:

Dashboard

Tool 1

Tool 2

Tool 3

Tool 4

Il mio abbonamento

Profilo

Impostazioni

Logout

15. DASHBOARD HOME

Header:

Bentornato, [Nome]

Mostra una panoramica dell'account.

Card piano

Mostra:

piano attuale;

prezzo;

stato;

prossimo rinnovo;

utilizzi disponibili.

Esempio:

PRO

€20/mese

Abbonamento attivo

127 / 250 utilizzi

CTA:

Gestisci abbonamento

16. TOOL CARDS

Mostra i quattro tool in una griglia.

Ogni card deve avere:

icona;

nome;

descrizione;

utilizzo;

pulsante "Apri".

Tutti i tool sono accessibili dai tre piani.

La differenza tra i piani riguarda esclusivamente il numero di utilizzi.

17. PAGINA DEI SINGOLI TOOL

Ogni tool deve avere una pagina separata.

Routes:

/dashboard/tool-1

/dashboard/tool-2

/dashboard/tool-3

/dashboard/tool-4

Ogni tool deve essere un modulo indipendente.

Quando fornirò la logica reale dei tool:

integra il codice;

mantieni la logica originale;

collega input e output;

collega autenticazione;

collega sistema utilizzi;

registra ogni utilizzo;

gestisci loading;

gestisci errori;

gestisci risultati.

Non creare una singola componente condivisa che renda difficile integrare i quattro tool separatamente.

18. PAGINA ABBONAMENTO

Crea:

/dashboard/subscription

Mostra:

piano attuale;

prezzo;

stato;

data rinnovo;

utilizzo corrente;

limite;

storico;

pulsante per gestire l'abbonamento.

Per modificare o cancellare l'abbonamento utilizza le funzionalità appropriate di Lemon Squeezy.

19. UPGRADE

Se l'utente è Starter:

mostra:

Passa a Pro — €20/mese

e:

Passa a Business — €25/mese

Se è Pro:

mostra:

Passa a Business — €25/mese

Non mostrare l'upgrade verso il piano già attivo.

20. ACCOUNT

Pagina:

/dashboard/profile

Permetti di gestire:

nome;

email;

avatar;

password;

eliminazione account.

La cancellazione deve richiedere conferma esplicita.

21. RESPONSIVE

Il progetto deve essere completamente responsive.

Desktop:

Sidebar fissa + contenuto.

Tablet:

Sidebar adattiva.

Mobile:

Menu hamburger.

La dashboard deve essere perfettamente utilizzabile da smartphone.

22. DESIGN DELLA DASHBOARD

Utilizza:

dark background;

card scure;

bordi sottili;

gradienti viola elettrico/verde;

glow leggero;

pulsanti moderni;

micro-interazioni;

progress bar;

badge;

icone coerenti.

Evita:

gradienti eccessivamente aggressivi;

interfacce troppo luminose;

troppe animazioni;

look da videogame.

Il risultato deve sembrare un SaaS premium reale.

23. STATI

Ogni tool e ogni operazione deve avere:

loading;

success;

error;

empty;

unauthorized;

subscription inactive;

usage limit reached.

24. SICUREZZA

Implementa:

route protection;

autenticazione;

autorizzazione;

controllo subscription server-side;

controllo utilizzi server-side;

validazione input;

gestione sicura delle API;

variabili d'ambiente;

verifica webhook Lemon Squeezy.

Non esporre mai:

API key;

webhook secret;

credenziali;

dati sensibili

nel frontend.

25. ARCHITETTURA

Mantieni il codice modulare.

Struttura indicativa:

/pages
/components
/components/dashboard
/components/tools
/components/pricing
/components/auth
/lib
/services
/hooks
/types
/config
/api

Centralizza la configurazione di:

piani;

prezzi;

limiti;

tool;

Lemon Squeezy;

utilizzi.

Non duplicare la configurazione in più componenti.

26. CONFIGURAZIONE CENTRALIZZATA DEI PIANI

Crea una configurazione facilmente modificabile.

Esempio concettuale:

STARTER

€15

50 utilizzi

+50 bonus primo mese

tutti i tool

PRO

€20

250 utilizzi

tutti i tool

BUSINESS

€25

illimitato

tutti i tool

Se in futuro cambio i prezzi o i limiti, voglio poter modificare la configurazione senza dover cercare il valore in tutto il progetto.

27. EMAIL E NOTIFICHE

Prepara l'architettura per poter aggiungere successivamente:

email di benvenuto;

conferma abbonamento;

pagamento riuscito;

pagamento fallito;

abbonamento cancellato;

raggiungimento limite;

rinnovo imminente.

Non è necessario implementare tutte queste email nella prima versione se richiede servizi esterni, ma struttura il progetto per poterle aggiungere.

28. SEO

La landing page deve essere predisposta per SEO.

Inserisci:

title;

meta description;

Open Graph;

favicon;

struttura heading corretta;

URL puliti.

Il nome del prodotto deve essere:

OP+studioKdp

29. PERFORMANCE

Ottimizza:

caricamento iniziale;

immagini;

componenti;

chiamate API;

dashboard;

caricamento dei tool.

Non caricare inutilmente tutti i tool contemporaneamente.

I tool devono essere caricati quando necessario.

30. IMPORTANTISSIMO — I 4 TOOL

I quattro tool saranno forniti da me.

Prima di modificarne la logica:

analizza il tool;

identifica input;

identifica output;

identifica API;

identifica dipendenze;

identifica eventuali API key;

identifica costi di utilizzo;

identifica eventuali limiti tecnici.

Poi integralo nella piattaforma.

Ogni tool deve essere indipendente ma utilizzare il sistema centrale di autenticazione, subscription e usage.

31. OBIETTIVO FINALE

Voglio ottenere una piattaforma SaaS reale chiamata:

OP+studioKdp

con questo modello:

STARTER — €15/mese

tutti i 4 tool

50 utilizzi/mese

primo mese +50 utilizzi bonus

PRO — €20/mese

tutti i 4 tool

250 utilizzi/mese

badge "Più scelto"

BUSINESS — €25/mese

tutti i 4 tool

utilizzo illimitato

Pagamento e abbonamento tramite:

Lemon Squeezy

Il flusso finale deve essere:

Landing Page
↓
Pricing
↓
Registrazione
↓
Checkout Lemon Squeezy
↓
Pagamento
↓
Webhook
↓
Attivazione subscription
↓
Dashboard
↓
Utilizzo dei 4 tool
↓
Controllo utilizzi
↓
Rinnovo mensile

Costruisci l'applicazione con un'architettura professionale, sicura e scalabile.

Non creare semplicemente un mockup.

Voglio una vera base applicativa SaaS pronta per collegare Lemon Squeezy e integrare i miei quattro tool. SISTEMA CREDITI / TOKEN — OP+studioKdp

Implementa un sistema centralizzato di consumo dei token/crediti per i 4 tool di OP+studioKdp.

Regola generale

Un token viene consumato solo quando l'utente completa con successo un'operazione che produce il risultato finale del tool.

NON consumare token per:

apertura del tool;

caricamento della pagina;

inserimento/modifica degli input;

anteprima;

tentativi falliti;

errori del server;

errori API;

operazioni annullate dall'utente.

Il token deve essere scalato soltanto al completamento dell'azione specifica indicata per ciascun tool.

1. COPERTINE

Per il tool Copertine:

1 utilizzo = 1 token

Il token deve essere consumato quando l'utente esporta l'immagine finale.

Esempio:

L'utente genera/visualizza una copertina:

→ nessun token ancora consumato.

L'utente modifica la copertina:

→ nessun token consumato.

L'utente visualizza l'anteprima:

→ nessun token consumato.

L'utente clicca:

"Esporta immagine"

e l'esportazione viene completata correttamente:

→ -1 token

Se l'esportazione fallisce:

→ 0 token consumati

2. PUBBLICAZIONE

Per il tool Pubblicazione:

1 generazione completata = 1 token

Ogni volta che il sistema completa con successo una generazione:

→ -1 token

Esempio:

Generazione 1 completata:

→ -1 token

Generazione 2 completata:

→ -1 token

Generazione 3 completata:

→ -1 token

Quindi:

3 generazioni completate = 3 token

Il token deve essere consumato al completamento effettivo della generazione.

Se una generazione fallisce:

→ non consumare token.

3. A+ KDPstudio

Per il tool A+ KDPstudio:

1 generazione completata = 1 token

Ogni generazione completata con successo consuma:

1 token

Esempio:

1 generazione → -1 token

2 generazioni → -2 token

5 generazioni → -5 token

Se la generazione fallisce:

→ 0 token consumati.

4. TRIAGE

Per il tool Triage:

1 download delle tre cartelle complete = 1 token

Il token NON deve essere consumato quando:

l'utente apre Triage;

carica i file;

il sistema analizza i file;

vengono visualizzati i risultati;

l'utente visualizza l'anteprima.

Il token viene consumato solamente quando l'utente effettua il download finale delle tre cartelle e il download viene completato correttamente.

Quindi:

Analisi → 0 token

Anteprima → 0 token

Download delle tre cartelle completato → -1 token

Se il download/generazione dell'archivio fallisce:

→ 0 token consumati

5. TABELLA DEL CONSUMO

Implementa questa logica centrale:

ToolEvento che consuma il tokenTokenCopertineEsportazione immagine completata1PubblicazioneOgni generazione completata1A+ KDPstudioOgni generazione completata1TriageDownload completato delle 3 cartelle1

6. CONTROLLO PRIMA DELL'OPERAZIONE

Prima di iniziare un'operazione che potrebbe consumare un token, verifica che l'utente abbia almeno 1 credito disponibile.

Se:

credits_remaining > 0

consenti l'operazione.

Se:

credits_remaining = 0

NON avviare l'operazione a pagamento.

Mostra una schermata/modal:

Hai esaurito i tuoi crediti mensili.

Con:

Passa a un piano superiore

e mostra le alternative disponibili.

7. IMPORTANTE — TRANSAZIONE ATOMICA

Il consumo del token deve essere gestito in modo sicuro lato server.

Non fare semplicemente:

credits = credits - 1

dal frontend.

Utilizza una transazione o una funzione server-side atomica che:

verifica che l'utente abbia un credito disponibile;

verifica che l'operazione sia stata completata;

registra l'operazione;

scala esattamente 1 credito;

restituisce il nuovo saldo.

Questo deve impedire:

doppio click;

richieste duplicate;

race condition;

manipolazione del frontend;

consumo negativo.

8. IDEMPOTENZA

Ogni operazione che consuma token deve avere un identificatore univoco.

Esempio:

operation_id

Se la stessa richiesta viene inviata due volte accidentalmente:

deve essere consumato un solo token.

Questo è particolarmente importante per:

esportazione Copertine;

generazione Pubblicazione;

generazione A+ KDPstudio;

download Triage.

9. STORICO DEI CREDITI

Crea una tabella per registrare ogni consumo.

Esempio:

credit_transactions

id

user_id

subscription_id

tool_id

operation_id

transaction_type

amount

description

created_at

Per un consumo:

transaction_type = usage

amount = -1

Esempio:

Tool:

A+ KDPstudio

Operazione:

Generazione completata

Transazione:

-1 credito

10. DASHBOARD — CREDITI

Nella dashboard mostra sempre il saldo disponibile.

Esempio:

I tuoi crediti

127 / 250

Crediti rimanenti:

123

Progress bar:

████████░░

Aggiungi un pulsante:

Visualizza utilizzo

11. PAGINA UTILIZZO

Crea una pagina:

/dashboard/usage

Mostra:

Crediti disponibili

Numero grande e ben visibile.

Utilizzo del periodo

Esempio:

123 / 250 utilizzati

Consumo per tool

Copertine:

23 utilizzi

Pubblicazione:

41 utilizzi

A+ KDPstudio:

36 utilizzi

Triage:

23 utilizzi

Storico

Mostra le ultime operazioni:

data;

ora;

tool;

operazione;

credito consumato.

Esempio:

29/08/2026 — A+ KDPstudio — Generazione completata — -1

12. RESET MENSILE

I crediti devono essere associati al periodo dell'abbonamento.

Starter:

50 crediti per periodo

50 crediti bonus solamente nel primo periodo

Totale primo periodo:

100

Dal secondo periodo:

50

Pro:

250 crediti per periodo

Business:

illimitato

Al rinnovo del periodo:

resetta il contatore;

assegna i nuovi crediti previsti dal piano;

NON trasferire automaticamente i crediti non utilizzati al mese successivo, salvo futura configurazione esplicita.

13. BONUS STARTER

Il bonus Starter deve essere separato dai crediti normali.

Esempio:

monthly_credits = 50

bonus_credits = 50

Totale:

100

Quando viene consumato un credito:

utilizza prima il credito bonus oppure implementa una logica coerente e documentata.

L'importante è che:

il bonus sia utilizzabile nel primo periodo;

il bonus non venga ricreato al rinnovo;

il bonus non venga assegnato nuovamente in caso di riattivazione;

il sistema sappia distinguere crediti normali e bonus.

Aggiungi nel database:

starter_bonus_granted

starter_bonus_used

14. BUSINESS — CREDITI ILLIMITATI

Per Business:

€25/mese

Tutti i tool:

ILLIMITATI

Non scalare un credito dal saldo per gli utenti Business.

Tuttavia, registra comunque le operazioni nella tabella credit_transactions oppure in una tabella usage_events, in modo da poter conoscere l'utilizzo reale degli utenti.

Questo sarà utile in futuro per:

analytics;

controllo abuso;

statistiche;

eventuali fair-use policy.

15. REGOLA FONDAMENTALE

Il sistema deve distinguere chiaramente tra:

GENERARE / ELABORARE

e

CONSUMARE UN CREDITO

Non tutte le azioni all'interno dei tool consumano credito.

La regola deve essere:

COPERTINE

Credito al completamento dell'esportazione.

PUBBLICAZIONE

Credito ad ogni generazione completata.

A+ KDPstudio

Credito ad ogni generazione completata.

TRIAGE

Credito al completamento del download delle tre cartelle.

Questa logica deve essere implementata centralmente e non duplicata nei singoli componenti frontend.

16. PRIORITÀ

La precisione del sistema di consumo dei crediti è una funzionalità critica del SaaS.

È fondamentale evitare:

addebiti multipli;

addebiti per operazioni fallite;

crediti negativi;

bypass dei limiti;

doppio consumo causato da refresh;

doppio consumo causato da doppio click;

consumo client-side manipolabile.

Tutta la logica critica deve essere verificata server-side.

Il frontend deve solamente mostrare il saldo e lo stato restituito dal backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/73179a9c-c953-4bd4-b316-d82b1c1dbdbf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
