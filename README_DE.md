# Web Morse Runner

Ein kleiner CW-Contest-Simulator für das Web.

## Über
Dies ist eine neu geschriebene Version von Morse Runner als Web-Anwendung.

Die App wird auf GitHub Pages gehostet: https://fritzsche.github.io/WebMorseRunner/

**Translations:** [English](README.md) · [日本語](README_JP.md)


Das Projekt ist inspiriert durch das Programm [Morse Runner von VE3NEA - Alex Shovkoplyas](https://github.com/VE3NEA/MorseRunner). Die Idee, ein komplett neues Web-App-Projekt zu starten, stammt aus dem vorherigen Versuch des Autors, [Morse Runner auf Linux und Mac zu portieren](https://github.com/fritzsche/MorseRunner).


Dieses Projekt ist neu und unabhängig vom Alex-Projekt. Der originale Morse Runner zielt auf Windows und ist in Pascal entwickelt, während diese Version komplett von Grund auf in JavaScript neu geschrieben ist und auf die Nutzung in Webbrowsern abzielt.


## Funktionen

* Läuft im Browser mit JavaScript
* Datenschutz: Die App läuft in deinem Browser. Es werden keine Daten von Web Morse Runner gesammelt und auch nicht an den Webserver zurückgesendet.
* Web Audio API unter Verwendung von AudioWorklet
* Kein Backend
* Contest-Modi:
    * Single Call
    * Pileup
    * WPX Contest
    * DARC CW Ausbildungscontest (CWA)
    * A1CLUB AWT
    * CWOps CWT
    * IARU VHF
* (Komplexes) Rauschen
* Modulation
* Filter
* AGC
* Lesen der Rufzeichenliste aus calls.txt
* Geschwindigkeit in WPM
* Anzeige der QSO/h-Rate und Diagramm
* Einstellungen:
    * Pitch
    * RX Bandwidth
    * Mon. Level
    * RIT
    * Dauer des Contests
    * My Call
* Senden über Tasten und Funktionstasten
* ESM (Enter to Send Message)
* Punkteberechnung und Anzeige des Scores
* Anzeige des Logs
* QSO-Bestätigung
* Bandbedingungen (QRM/QRN/QSB/Flutter/LIDs)
* Transkript
* WAV-Aufnahme
* Expertenkonfiguration:
    * Farnsworth-Timing
    * DX-Station WPM (Standard oder individueller min/max-Bereich)
    * Contest-Start-Offset (simuliert das Einsteigen in einen laufenden Contest)

## (Noch) nicht implementierte Funktionen

* Bestenliste

## Status
Diese Web-App befindet sich in einer Beta-Phase. Ich suche noch nach Fehlern und optimiere die App. Bitte verwende GitHub Issues, um Bugs oder Feature-Wünsche zu melden. Du kannst mich auch per E-Mail kontaktieren.

## Benutzung
Web Morse Runner ist ein Contest-Simulator. Das Ziel ist es, möglichst viele Punkte (QSOs) und Multis (Präfixe) zu sammeln.

Beginne damit, die Parameter einzustellen, wie dein Rufzeichen, bevorzugte WPM usw., und starte den Contest durch Drücken der Run-Taste.

Im **Single Call**-Modus rufen dich Stationen an und du musst das QSO in die Felder Call/NR loggen. Im **Pileup**-Modus musst du CQ rufen. Abhängig vom Parameter "Activity" antworten mehr oder weniger Stationen.

Verwende die entsprechenden Tasten oder Funktionstasten, um den Stationen zu antworten. Weitere Informationen zur Tastatur findest du im Abschnitt [Tastatur](#tastatur). Du musst das QSO beenden, indem du TU sendest.

Der Simulator unterstützt ESM (Enter to Send Message), das heißt, das Drücken der Enter-Taste ermöglicht es dir, Nachrichten abhängig vom QSO-Status zu senden. Details zu ESM findest du: [hier](#esm-enter-to-send-message).

Wie in der realen Welt hören Stationen, die gerade senden, nicht auf das, was du sendest. Deshalb musst du warten, bis die DX-Station mit dem Senden fertig ist, bevor du antwortest.

## Datenschutz
Web Morse Runner wird in deinem Browser ausgeführt. Beim Start der App werden die notwendigen statischen Dateien vom Server geladen, aber **es werden keine Nutzungsdaten gesammelt**.

## Hosting
Web Morse Runner ist eine eigenständige JavaScript-App, deren offizielle Version auf GitHub gehostet wird.
Du kannst das Projekt auf deinem eigenen (lokalen) Webserver hosten. Du benötigst einen "Secure Context" (https oder localhost), damit Web Morse Runner ausgeführt werden kann.

## Betriebssysteme
Web Morse Runner wurde erfolgreich auf **Mac**/**Windows 11** und **Linux** getestet.
Hauptbrowser ist **Chrome**, aber **Edge**, **Firefox** und **Safari** sollen ebenfalls funktionieren.
Bitte hab Verständnis dafür, dass der Autor nicht alle Kombinationen von Betriebssystemen und Browsern bei jeder Änderung testen kann.

*Verwendung auf iOS*: Der Autor dieses Projekts konnte Web Morse Runner auf verschiedenen iOS-Geräten (iPhone/iPad) mit Safari und Chrome ausführen. Um Web Morse Runner zu verwenden, kannst du eine externe Bluetooth-Tastatur anschließen.
Um den Ton zu hören, überprüfe, dass der Stumm-Modus nicht aktiv ist und die Lautstärke eingestellt ist. Stelle in den Energieeinstellungen sicher, dass dein Contest nicht unterbrochen wird. Statt der Funktionstasten kann es nützlich sein, die F1-8 Tasten in Web Morse Runner zu drücken, um die Sitzung aktiv zu halten.


## Einstellungen
Die Einstellungen, die du in Web Morse Runner vornimmst, werden im lokalen Speicher deines Browsers gespeichert.

* **Call**: Dein eigenes Rufzeichen.
* **QSK**: Wenn ausgewählt, wechselt das System sehr schnell zwischen Senden und Empfang, sodass du die Bandaktivität zwischen jedem Dit/Dah hören kannst.
* **CW Speed**: Dies ist deine Sende-Geschwindigkeit. Alle rufenden Stationen antworten langsamer.
* **Pitch**: Die Frequenz deines Seitentons.
* **RX Bandwidth**: Die angewendete Filter-Bandbreite. Mache diesen Wert nicht zu klein, sonst hörst du möglicherweise keine rufenden Stationen außerhalb des Filterbereichs.
* **Mon. Level**: Die Lautstärke deines eigenen Seitentons. Verwende den System-Audiopegel, um die Gesamtlautstärke zu steuern.
* **RIT**: Der RIT-Wert. Bewege den Schieberegler, um RIT in der Frequenz nach oben/unten zu verschieben.

## Bandbedingungen

* **QRM**: Interferenz von anderen sendenden Stationen tritt von Zeit zu Zeit auf.
* **QRN**: Elektrostatische Interferenz.
* **QSB**: Die Signalstärke schwankt mit der Zeit.
* **Flutter**: Einige Stationen haben einen "auroralen" Klang.
* **LIDS**: Einige Stationen rufen dich an, wenn du mit einer anderen Station arbeitest, machen Fehler beim Senden, kopieren deine Nachrichten falsch und senden ein anderes RST als 599.

## Rufzeichen hochladen
Seit Release 0.05 wird Web Morse Runner die Rufzeicheninformationen, die in calls.txt gespeichert sind, im lokalen Speicher des Browsers zwischenspeichern. Die Datei calls.txt wird neu geladen, wenn du den lokalen Speicher löschst oder wenn du den **reload**-Link drückst.
Du kannst auch deine eigenen Rufzeichen über Datei-Upload bereitstellen, indem du den **upload**-Link drückst.
Die geladene Datei muss eine Standard-Textdatei sein, die ein Rufzeichen pro Zeile enthält.
Bitte beachte, dass sich das Upload-Format in Zukunft ändern kann.

Das Dateiformat für die Rufzeichendatei ist sehr einfach. Einige Beispiele findest du im GitHub-Repository (Ordner Example_Calls).


## Contest-Modi

Web Morse Runner unterstützt die folgenden Contest-Modi:
* **Single Call**: Es ruft immer eine Station dich an. Kein Pileup und du musst kein CQ rufen.
* **Pileup**: In dieser Station musst du zuerst CQ rufen, bevor Stationen antworten. Der Parameter *Activity* bestimmt, wie viele Stationen im Durchschnitt antworten. Die Anzahl der Stationen, die dich rufen, wird über der laufenden Uhr angezeigt.
* **WPX Contest**: Ähnlich wie der Pileup-Modus, aber die Anzahl der Stationen im Pileup wird nicht angezeigt. Die Verwendung von Bandbedingungen (QRM/QSB usw.) ist nicht erzwungen.
* **HST** (HST = High Speed Traffic): Stationen rufen sich schnell hintereinander. Der Parameter *Activity* bestimmt, wie viele Stationen erscheinen. Du protokollierst jedes QSO mit ESM.
* **DARC CWA** (EXPERIMENTELL): Austausch ist DOK. Du musst [DL-All_DOK.txt](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/DL-All_DOK.txt) [hochladen](#rufzeichen-hochladen), das die notwendigen DOK-Informationen für Stationen enthält. Beachte, dass die Punkte immer noch nach Präfix berechnet werden, nicht nach DOK. Dies könnte später aktualisiert werden.
* **AWT** (EXPERIMENTELL): Austausch ist der Name. Du musst [AWT.txt](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/AWT.txt) [hochladen](#rufzeichen-hochladen), das Beispielrufe mit Namen enthält. Die Punkteberechnung basiert weiterhin auf dem Präfix. Dies könnte später hinzugefügt werden.
* **CWOps CWT** (EXPERIMENTELL): Austausch ist der Name und die CWOps-Nr. Du musst [CWOps.txt](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/CWOps.txt) [hochladen](#rufzeichen-hochladen), das Beispielrufe mit Namen und Nummern enthält. Die Punkteberechnung basiert weiterhin auf dem Präfix. Dies könnte später hinzugefügt werden.
* **IARU VHF**: Austausch ist RST, laufende Nummer und dein eigener 6-stelliger QTH-Locator (LOC, z.B. `JN58TD`). Du musst eine der neuen Beispieldateien [hochladen](#rufzeichen-hochladen) — [`IARU-VHF-NOCW.txt`](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/IARU-VHF-NOCW.txt) für Stationen mit gemischten Betriebsarten oder [`IARU-VHF-ONLYCW.txt`](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/IARU-VHF-ONLYCW.txt) für CW-aktive Stationen — die Rufzeichen zusammen mit ihrem zugehörigen QTH-Locator enthalten. Trage deinen eigenen QTH-Locator vor dem Start des Contests im Feld **LOC** des My-Exchange-Panels ein.


## Pileup
Um ein Pileup zu meistern, ist es hilfreich, Station für Station auszuwählen. Typischerweise kannst du mit der Station beginnen, die auf der Frequenz ruft, die du am besten kopierst.
Um eine einzelne Station auszuwählen, kannst du das Fragezeichen verwenden.
Wenn du zum Beispiel DJ1? in das Call-Feld eingibst und **Enter** drückst, würden nur Stationen antworten, die mit DJ1 beginnen.

Beachte, dass die Station bereits Teile ihres Rufzeichens erkennt. Wenn du z.B. nur 1-2 Zeichen falsch geschrieben hast, wird die DX-Station versuchen, das korrekte Rufzeichen erneut zu senden.


## Tastatur
Die Hauptverwendung von Web Morse Runner erfolgt über die Tastatur.
### Funktionstasten
Die Funktionstasten F1-F8 werden verwendet, um verschiedene Nachrichten zu senden. Die zugewiesenen Nachrichten sind fest zugeordnet und auf dem Hauptbildschirm sichtbar.
Moderne Betriebssysteme verwenden Funktionstasten jedoch für alle möglichen Zwecke, z.B. um die Lautstärke oder Helligkeit des Displays zu steuern. Um sie als Funktionstasten zum Laufen zu bringen, musst du möglicherweise einige Einstellungen in deinem Betriebssystem oder deiner Tastatur vornehmen.


#### macOS Ventura oder neuer
1) Wähle Apple-Menü -> Systemeinstellungen.
2) Klicke in der Seitenleiste auf Tastatur.
3) Klicke rechts auf die Schaltfläche Tastatur-Shortcuts.
4) Klicke in der Seitenleiste auf Funktionstasten.
5) Aktiviere "F1-, F2- usw. Tasten als Standard-Funktionstasten verwenden".

#### Windows 11
Es gibt verschiedene Möglichkeiten, Funktionstasten unter Windows zu aktivieren. Die Maschine des Autors unterstützte die Fn-Taste. Das Drücken der Fn-Taste und der "Schloss-Symbol"-Taste (auf der Esc-Taste) hat die Funktionstasten dauerhaft gesperrt. Andere berichten, dass BIOS- oder UEFI-Einstellungen funktionieren oder eine Lock-Taste über die Systemsteuerung verwendet wird.


#### Chrome und F7
Im Google Chrome-Browser wird die **F7**-Taste verwendet, um "Caret Browsing" zu aktivieren.
Der Autor von Web Morse Runner verwendet Caret Browsing nicht und hat es einfach deaktiviert und das Kontrollkästchen "Nicht mehr fragen" angekreuzt. Jetzt wird die **F7**-Taste verwendet, um das Fragezeichen zu senden.


#### Verwendung von Zifferntasten
Auf einigen Plattformen, z.B. auf mobilen Geräten, ist es schwierig, Funktionstasten zu verwenden. Statt der Funktionstaste kannst du CTRL-1 / Meta-1 / Alt-1 / Numpad 1 für F1 und CTRL-2 / Meta-2 / Alt-2 / Numpad 2 für F2 usw. drücken.

### Unterstützte Tastatur-Shortcuts

#### ESM (Enter to Send Message)
Die Hauptverwendung von Web Morse Runner erfolgt über ESM.
Das bedeutet, dass der Cursor nach dem Starten des Contests automatisch in das Call-Feld platziert wird.

* Um CQ zu rufen, musst du nur die **Enter**-Taste drücken.
* Sobald eine Station antwortet, gibst du das Rufzeichen in das Call-Feld ein, in dem sich der Cursor bereits befindet.
* Drücke erneut **Enter**. Web Morse Runner sendet den Rapport 599 und deine laufende Nummer. Der Cursor rückt automatisch in das NR-Feld vor.
* Höre nun und gib die Nummer in das NR-Feld ein, in das dein Cursor automatisch vorgerrückt ist.
* Drücke erneut **Enter** und Web Morse Runner schließt das QSO ab, indem es **TU** sendet.
* Nachdem das QSO abgeschlossen ist, werden die Felder Call, RST und NR automatisch gelöscht und der Cursor wird wieder in das Call-Feld gesetzt. So kannst du mit dem nächsten QSO fortfahren.

#### Sonstige Tastatur

* **TAB**: Bewege den Cursor zwischen den Feldern Call -> RST -> NR. Wenn sich der Cursor im NR-Feld befindet, sollte ein weiteres TAB zum Call-Feld zurücknavigieren.
* **Space**: Durch Drücken der Leertaste wird das fokussierte Feld weitergeschaltet (von Call zu NR, RST zu NR und NR zu Call). Wenn RST leer ist, wird es mit 599 gefüllt.
* **Alt-Enter, Meta-Enter, Ctrl-Enter**: QSO speichern.
* **Alt-W, Ctrl-W**: Eingabefelder löschen.
* **<;>, <Insert>**: Entspricht F5 + F2.
* **<+>, <.>, <,>, <[>**: Entspricht F3 + Save.
* **<PageUp>, <PageDown>**: Tastgeschwindigkeit in 5-WPM-Schritten.

* **Funktionstasten**
    * **F1**: CQ rufen
    * **F2**: RST und Nummer senden: Verwende es, wenn die DX-Station NR? oder AGN fragt.
    * **F3**: TU senden: Wird verwendet, um der DX-Station das Ende des QSOs zu signalisieren. Möglicherweise nötig, wenn die Station ein früheres TU nicht gehört hat, du den Kontakt aber bereits geloggt hast.
    * **F4**: Eigenes Rufzeichen senden: In der Praxis in Web Morse Runner sehr selten verwendet.
    * **F5**: DX-Rufzeichen senden: Sehr nützlich, wenn die Station das Rufzeichen nicht verstanden hat, z.B. weil du mit der Station zusammengekommen bist. Sende ihr Rufzeichen erneut, damit die Station RST und NR sendet.
    * **F6**: B4 - Du hattest vorher QSO mit dieser Station. In Web Morse Runner sehr selten verwendet.
    * **F7**: Fragezeichen. Du hast den Call nicht vollständig erhalten, ein Fragezeichen bewirkt, dass die andere Station den Call erneut sendet.
    * **F8**: NIL - Zeigt der anderen Station an, dass du ihren Call nicht erhalten hast. Sehr nützlich in Web Morse Runner, wenn du bereits ein falsches Rufzeichen gesendet hast. Die DX-Station geht davon aus, dass du QSO mit jemand anderem hast und antwortet dir nicht. Durch das Senden von NIL zeigst du an, dass du den anderen Call nicht aufnehmen konntest, sodass die DX-Station versuchen wird, ihren Call erneut zu senden.
* **Pfeil-Auf/Ab**: Steuert das RIT. Stationen rufen dich nicht immer auf der gleichen Frequenz. Abhängig von der Filter-Bandbreite hörst du die DX-Station möglicherweise gar nicht oder nur mit einem sehr schwachen Signal. Verwende die Pfeiltasten, um das RIT nach oben/unten zu verschieben.
* **STRG-Pfeil-Auf/Ab, Alt-Pfeil-Auf/Ab, Meta-Pfeil-Auf/Ab**: Bandbreite.
* **Escape**: Senden abbrechen.

## Statistiken
Web Morse Runner bietet (seit Version 0.11-Beta) einige statistische Informationen. Die Daten basieren auf geloggten Daten und umfassen bestätigte und unbestätigte QSOs.
Das QSO/h wird angezeigt, nachdem du deinen ersten Contest geloggt hast.
Sobald du die 5-Minuten-Marke erreichst, werden die QSO-Daten der letzten 5 Minuten dargestellt.
Web Morse Runner zeigt auch ein Balkendiagramm mit dem QSO/h in 5-Minuten-Intervallen an. 24 Balken (je 5 Minuten). Dies ist nützlich, wenn du längere Contest-Sitzungen durchführst.

## Transkript
Das Transkript zeigt ein chronologisches Protokoll aller während des Contests ausgetauschten Nachrichten. Es ist standardmäßig ausgeblendet. Klicke auf das **📄 (Seitensymbol)**, um es ein- oder auszublenden. Das Transkript wird bei Beginn eines neuen Contests gelöscht.

## Expertenkonfiguration
Klicke auf das **⚙ (Zahnrad-Symbol)**, um das Expertenkonfigurations-Panel zu öffnen. Diese Einstellungen werden bei Änderung während eines laufenden Contests sofort wirksam.

* **Max Pile-up**: Begrenzt die maximale Anzahl von DX-Stationen, die dich in Pileup-relevanten Modi gleichzeitig rufen. Nützlich, wenn du mit einer überschaubareren Anzahl von Anrufern üben möchtest. Auf 0 setzen für unbegrenzt.
* **DX Stations WPM**: Steuert die Geschwindigkeit der rufenden DX-Stationen:
    * *Standard* — Stationen antworten mit einer Geschwindigkeit zwischen der Hälfte und der vollen Geschwindigkeit deiner CW-Geschwindigkeitseinstellung.
    * *Individual* — Lege deinen eigenen minimalen und maximalen WPM-Bereich für DX-Stationen unabhängig von deiner eigenen Geschwindigkeit fest.
* **Min WPM / Max WPM** (im Individual-Modus sichtbar): Die untere und obere Grenze des Geschwindigkeitsbereichs der DX-Station.
* **Farnsworth Timing**: Wenn aktiviert, werden Zeichen mit voller Zeichengeschwindigkeit gesendet, aber zusätzliche Abstände werden zwischen Zeichen und Wörtern eingefügt, sodass die effektive WPM-Rate niedriger ist. Dies ist die klassische Farnsworth-Methode zum Lernen von CW mit Geschwindigkeit. Setze das effektive WPM mit dem Feld **Eff. WPM** — es muss niedriger als deine CW Speed sein.
* **Contest Start Offset**: Simuliert das Einsteigen in einen Contest, der bereits eine bestimmte Anzahl von Minuten läuft. Die Seriennummern der DX-Stationen beginnen bei einem Wert, der dem Offset entspricht. Dies ist nützlich, um realistische Austauschnummern zu üben, anstatt immer bei 001 zu beginnen.

## WAV-Aufnahme
Web Morse Runner kann den erzeugten Audio-Stream in eine WAV-Datei zur späteren Überprüfung oder Analyse aufnehmen.

Die **⏺ Rec**-Taste ist im Contest-Panel immer verfügbar. Sie arbeitet unabhängig von der Run-Taste:

1. **Aufnahme bereit machen (Arm)** — Drücke **⏺ Rec** vor oder während eines Contests. Die Taste wird rot und zeigt an, dass sie scharfgeschaltet und bereit ist.
2. **Aktive Aufnahme** — Sobald ein Contest läuft und die Taste scharfgeschaltet ist, beginnt die Aufnahme automatisch. Die Taste blinkt, um anzuzeigen, dass Audio aufgenommen wird.
3. **Pausiert zwischen Contests** — Wenn der Contest stoppt, während die Aufnahme scharfgeschaltet ist, wird die Taste wieder dauerhaft rot. Wenn der nächste Contest beginnt, wird die Aufnahme automatisch fortgesetzt und an dieselbe Sitzung angehängt.
4. **Download** — Drücke **⏺ Rec** erneut, um die Aufnahme zu entschärfen. Die Aufnahme stoppt und die WAV-Datei wird automatisch heruntergeladen.

Die Ausgabe ist eine unkomprimierte PCM-WAV-Datei (11.025 Hz, 16-Bit Mono) mit dem Namen `morse_<CALL>_<DATE>_<TIME>Z.wav`. Bei dieser Abtastrate ist das Audio gut für CW-Töne geeignet und die Dateigröße beträgt ungefähr 1,3 MB pro Minute. Die Aufnahme ist auf 90 Minuten pro Sitzung begrenzt (≈ 119 MB).

## Versionsverlauf
* **0.18-beta** (2026-06-13)
  * Neuer **IARU VHF Contest**-Modus. Der Austausch besteht aus RST, laufender Nummer und deinem eigenen QTH-Locator (LOC). Danke an Kalin (LZ1MZK) für den Pull Request. Zwei neue Beispiel-Call-Dateien werden im Ordner [Example_Calls](Example_Calls) bereitgestellt: `IARU-VHF-NOCW.txt` (gemischte Betriebsarten) und `IARU-VHF-ONLYCW.txt` (CW-aktive Stationen). Beide Dateien verknüpfen Rufzeichen mit ihrem 6-stelligen Maidenhead-Locator.
* **0.17.1-beta** (2026-06-10)
  * Bugfix: kleinere Layout-Bugs behoben.
* **0.17-beta** (2026-06-09)
  * WAV-Aufnahme: Die **⏺ Rec**-Taste schaltet den Rekorder unabhängig von der Run-Taste scharf. Audio wird während des laufenden Contests aufgenommen und beim erneuten Drücken der Taste als WAV-Datei heruntergeladen. Die Aufnahme schaltet sich über mehrere Contest-Sitzungen hinweg scharf und ab, ohne dass Daten verloren gehen.
* **0.16-beta** (2026-06-06)
  + Neue Einstellung zur Unterstützung des Farnsworth-Timings als Teil der Expertenkonfiguration.
  * Neue Einstellung zur Unterstützung höherer Contest-Nummern.
* **0.15-beta** (2026-06-02)
   * Neue Expertenkonfiguration, die du durch Drücken des "Zahnrad"-Symbols in den Contest-Einstellungen öffnen kannst.
       * Max Pile-up: Du kannst die Anzahl der DX-Stationen begrenzen, die in einem Pileup-relevanten Modus antworten, um zu viele rufende Stationen zu vermeiden.
       * DX-Stations: Du kannst die Morserunner-Standardeinstellung (Standard) verwenden oder individuelle Max/Min WPM für die antwortenden DX-Stationen festlegen. In der Standardeinstellung liegt die Geschwindigkeit der DX-Stationen zwischen der Hälfte deiner eigenen Mindestgeschwindigkeit und deiner eigenen Maximalgeschwindigkeit.
* **0.14-beta** (2026-06-01)
   * Ein Transkript wurde hinzugefügt, wie in einem Feature-Wunsch vorgeschlagen. Dieses Transkript ist standardmäßig ausgeblendet, kann aber durch Klicken auf das "Seiten"-Symbol sichtbar gemacht werden.
* **0.12-beta** (2026-05-24) -- **Pfingsten 2026 Edition**
   * Neuer **CWOps CWT Contest** hinzugefügt. Danke an David - CT7AUP für den Pull Request. Dieser Pull Request wurde geändert, um besser in die aktuelle Architektur zu passen. GitHub-Bug-Reports sind willkommen.
* **0.11.2-beta** (2026-05-03)
   * Bugfix: Auf Apple-Tastaturen kann die Option-Taste in Kombination mit einer Zahl verwendet werden, um die entsprechende Funktionstaste auszulösen, jedoch sandte <Option>-5 nicht <His>, sondern <His><TU>. Der Grund ist, dass die Browser-Event-Aktion "[" im key-Attribut sendet. Dies wurde von OE8ZZZ gemeldet, vielen Dank für das Feedback.
   * Eine kleine Regression wurde entfernt, die eine korrekte Protokollierung im DARC-Ausbildungscontest und A1Club Contest verhindern konnte.
* **0.11.1-beta** (2026-01-01)
   * Bugfix: Das Senden von Call / Nr mit <Insert> oder <;> sollte das gesendete Call/Nr speichern, sodass ESM das gesendete Call/Nr verwendet.
* **0.11-beta** (2025-12-27) -- **Zwischen den Jahren 2025 Edition**
   * Neu: QSO pro Stunde wird als Text und Diagramm angezeigt.
   * Neu: WPX Contest-Modus. (Bandbedingungen werden nicht erzwungen)
   * UI-Redesign, um Platz für das QSO/h-Diagramm zu schaffen.
   * Bugfix: Bei Verwendung der QRN-Bandbedingung konnte ein Sinuston auftreten (Amplitude verursacht flache Kurve im Filter).
   * Bugfix: QSB/Flutter-Bandbedingung konnte während eines laufenden Contests nicht aktiviert werden.
* **0.10-beta** (2025-12-20) -- **Weihnachts-Edition 2025**
   * Bugfix: Präfix-Erkennung für CEPT-ähnliche Präfixe, z.B. F/DJ1TF, funktioniert nun.
   * Unterstützung für weitere Tastatur-Shortcuts (tnx DK5TX es DJ5CW für die Anfrage)
      * Alt-W, Ctrl-W, F11 - Eingabefelder löschen.
      * Alt-Enter, Shift-Enter, Ctrl-Enter - QSO speichern.
      * <+>, <.>, <,>, <[> - Entspricht F3 + Save
      * <;>, <Insert> - Entspricht F5 + F2
      * <PageUp>, <PageDown> - WPM um 5 ändern
      * <CTRL>-Pfeil-Auf/Ab - Bandbreite
   * Bugfix (2025-12-20):
      * Danke an DK5TX für die Meldung des Problems: Wenn der Call geändert und <Insert> oder <;> gedrückt wird, wird der Call gesendet, sodass das QSO von der DX-Station bestätigt wird.
* **0.9-beta** (2025-12-06) - **Nikolaus-Edition**
   * Das Drücken der Escape-Taste bricht das Senden ab
   * TX-Anzeige
   * Das Aktualisieren des Rufzeichens ist möglich, nachdem die Übertragung gestartet wurde. Die Aktualisierung ist nur erfolgreich, wenn die Änderungen noch nicht übertragen wurden.
* **0.8.4-beta** (2025-12-03)
   * Verbesserung einiger Situationen auf macOS, bei denen der Audioprozess auf Safari und Chrome nicht startete.
   * Auf Firefox und macOS kann eine Ausgabefrequenz > 48.000 kHz Probleme verursachen. Es ist ratsam, die Abtastrate entsprechend zu reduzieren oder Chrome oder Safari zu verwenden.
* **0.8.3-beta** (2025-12-02)
   * Ein von Lutz DM6EE gemeldeter Bug wurde behoben, da die Leertaste nicht funktionierte. Dies war eine durch die Android-Anpassung eingeführte Regression. Danke für den Bug-Report!
   * Ein Timing-Bug behoben, der in seltenen Fällen während der Initialisierung auftreten konnte.
* **0.8.2-beta** (2025-05-28)
   * Beim Abgleich von Teil-Rufzeichen war der originale Morse Runner nicht so streng wie Web Morse Runner, jetzt ist Web Morse Runner entspannter.
* **0.8.1-beta** (2025-05-27)
   * Zwei Bugs behoben, die dazu führen konnten, dass Stationen nach einem Ruf mit unvollständigem Rufzeichen nicht antworteten.
* **0.8-beta** (2025-05-21)
   * HST-Modus hinzugefügt, grazie Pietro IN3GYO
   * kleiner Bugfix
   * (2025-05-22) Bugfix:
     * Funktionstaste F5 sendet <his> nicht.
* **0.7-beta** (2025-04-08) - **Oster-Edition**
   * Weitere interne Umstrukturierung des Codes, um verschiedene Contests zu ermöglichen.
   * Bugfix: Die Contest-Definition wurde möglicherweise nicht korrekt geladen, wenn die Konfiguration noch initial ist. Dies wurde im Firefox-Browser gefunden, da Chrome-basierte Browser Module scheinbar leicht unterschiedlich instanziieren.
   * Experimentelle Unterstützung für AWT (A1Club Weekly Contest) und DARC CWA Contest
   * (2025-04-13) Einige Bugs behoben:
      * Vermeidung, dass zusätzliche DX-Stationen angefordert werden, während die ursprüngliche Anfrage noch aussteht.
      * Einige Android-Geräte verwenden andere Tastaturereignisse (danke TOM DG5CW für die Meldung).
      * Ein Bug beim Lesen der neuen Contest-Definition konnte dazu führen, dass das Contest-Austauschfeld ausgeblendet wurde, wenn der Contest gestartet wurde.
      * Alt-Modifikator hinzugefügt, um einen Funktionstastendruck zu simulieren.


* **0.6-beta** (2025-2-27) - **Karnevals-Edition**
   * Interne Umstrukturierung des Codes, um in zukünftigen Versionen verschiedene Contests zu ermöglichen.
   * Tom (DF7TV) stellte eine Liste japanischer Rufzeichen basierend auf der Datenbank von JJ1WTL bereit. (Datei JA-All_JJ1QTL)
   * Eine Liste deutscher Rufzeichen basierend auf der DB von DL6ER wird bereitgestellt (Datei DL-All_DOK.txt)
   * Mobile Nutzung: Wenn du CTRL oder Meta gedrückt hältst, kannst du die Zifferntasten als Ersatz für die Funktionstasten verwenden. (Einige mobile Plattformen unterstützen keine Funktionstasten). Wenn du eine Tastatur mit Ziffernblock hast, kannst du diese Tasten ebenfalls verwenden.
* **0.5-beta** (2024-12-27) - **Neujahr / New Year 2024 Edition**
   * Unterstützung für Bandbedingungen QRN, QRM, QSB, Flutter und LIDs hinzugefügt.
   * Neue Tastaturabkürzung: Die **Shift**-Taste wird nun unterstützt.
   * Rufzeichen werden nun im lokalen Speicher des Browsers zwischengespeichert und nicht neu geladen.
   * Experimentell neu: Lade deine eigene Rufzeichendatei hoch. (Beispiel-Rufzeichenliste beigetragen von K5GQ)
   * Mehrere wichtige Bugfixes.
* **0.4-alpha** (2024-12-15) -- **Weihnachts-Edition 2024**
   * Pileup-Modus hinzugefügt.
   * Tab-Sequenz auf Call/RST/NR-Felder beschränkt.
   * Größe der Call/RST/NR-Felder vergrößert.
   * Verschiedene Bugs behoben.
* **0.3-alpha** (2024-12-12) Bugfix: Morse-Timing behoben, einschließlich Korrektur von v0.2-alpha.
* **0.2b-alpha** (2024-12-11) Die Änderungen in 0.2 verursachten eine Regression, da eine hörbare Lücke auftrat, wenn 2 Nachrichten hintereinander gesendet wurden. Dies resultierte aus einer Überallokation. Rollback der Änderungen aus 0.2-alpha, um hörbare Lücken zu vermeiden.
* **0.2-alpha** (2024-12-11) Verbesserung/Bugfix: Diese JavaScript-Version verwendete dynamisch allokierte Arrays, während Pascal statisch große Arrays verwendete. Dies wurde nun in ein vorab allokiertes Float32Array geändert, um auch die Leistung zu verbessern und unnötige Allokationen im Audio-Buffer-Prozess zu vermeiden. In einigen Situationen konnte dies zu mehr Abstand führen.
* **0.1-alpha** (2024-11-25) Erste öffentliche Veröffentlichung.

## Referenzen
* [Morse Runner](https://github.com/VE3NEA/MorseRunner) (Windows/Pascal) von VE3NEA - Alex Shovkoplyas
* [Morse Runner Community Edition](https://groups.io/g/MorseRunnerCE)
* [Morse Runner Port](https://github.com/fritzsche/MorseRunner) (Linux/Mac) portiert von DJ1TF - Thomas Fritzsche


## Danksagungen
Möchte VE3NEA Alex Shovkoplyas für seine inspirierende Arbeit an Morse Runner danken.




73, Thomas - DJ1TF


