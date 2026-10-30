# Questionario di gradimento · Pro Loco Golasecca

Pagina statica pubblicata su <https://gradimento.golasecca.org/> tramite GitHub Pages. La repository contiene il file `CNAME` per il dominio personalizzato: va mantenuto nella radice.

## Halloween 2026

La pagina raccoglie le risposte per **Halloween 2026 · Terrore a Golasecca**. L'URL dell'app web Google Apps Script è in `config.js`; lo script è collegato al [foglio risposte di Halloween](https://docs.google.com/spreadsheets/d/1u1MPqy1XRinNz3g3auD1SjQZzMA4dFrbA1Cgr6MwxlQ/edit). Il codice dello script è conservato in `google-apps-script/Code.gs`.

`qr-questionario-halloween.svg` è il QR vettoriale per la stampa; `qr-questionario-halloween.png` è la versione raster. Entrambi aprono <https://gradimento.golasecca.org/>.

## Nuovi eventi

Per ogni evento crea un Google Sheet distinto e uno script Apps Script associato. Copia `google-apps-script/Code.gs`, cambia `EVENT_ID`, pubblica una nuova app web eseguita dal proprietario e accessibile a chiunque, poi configura il relativo URL `/exec` nella pagina. Aggiungi l'evento al questionario solo quando il collegamento è pronto, e genera un QR per il suo link.

Il browser invia le risposte allo script in modalità `no-cors`, quindi non può leggere la conferma di scrittura nel foglio. Dopo ogni nuovo deployment, invia una risposta di prova e verifica la riga direttamente nel foglio.

## Sviluppo locale

Il sito non richiede build né dipendenze. Apri `index.html` oppure avvia `python3 -m http.server 8000` nella cartella del progetto e visita <http://localhost:8000/>.
