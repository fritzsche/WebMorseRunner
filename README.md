# Web Morse Runner

A small CW contest simulator for the web.

## About 
This is a new written version of Morse Runner as Web-Application.

The app is hosted on GitHub Pages: https://fritzsche.github.io/WebMorseRunner/


The Project is inspired by the Program [MorseRunner by VE3NEA - Alex Shovkoplyas](https://github.com/VE3NEA/MorseRunner). The Idea to start a complete new Web App Project originate from the authors previous effort to [port MorseRunner to Linux and Mac](https://github.com/fritzsche/MorseRunner).


This project is new and independent of Alex project. The original Morse Runner target Windows and is developed in Pascal, while this version is complete rewritten from scratch in Javascript and targeting the usage in web browsers. 


## Functions

* Runs in Browser using Javascript
* Web Audio API using AudioWorklet
* No Backend
* Contest Mode: 
    * Single Call
    * Pileup
    * DARC CW Ausbildungscontest (CWA)
    * A1CLUB AWT
* (Complex) Noise
* Modulation
* Filter
* AGC
* Read List of calls from calls.txt
* Speed in WPM
* Stetting: 
    * Pitch
    * RX Bandwidth
    * Monitor Level
    * RIT
    * Time the contest should run
    * My Call
* Sending via buttons and function key 
* ESM (Enter to Send Message)
* Calculate and display Score
* Display log
* Confirm QSO's
* Band Condition (QRM/QRN/QSB/Flutter/LID's)

## Features not (yet) implemented

* Other contest modes (no WPX / HST)
* WAV File Export
* Best-List
* Score over time
* some Keyboard shortcuts missing

## Status
This Web App is in a early stage. I'm still searching some bugs and looking for optimizations. The App can work, but consider this app as experimental.

## Usage
Web Morse Runner is a contest simulator. The target is to get as much points (QSO's) and multis (Prefix) as possible.

Start my setting the parameters, like your call sign, preferred WPM etc. and start the contest by pressing the run button.

In **Single Call** mode stations will call you and you need to log the QSO in the fields Call/NR. If you use the **Pileup** mode you need to call CQ. Depending on the parameter "Activity" more or less stations will call back to you.

Use the respective buttons or function key to respond to the stations. Find more information on the keyboard used in the section  [Keyboard](#keyboard). You need to end the QSO by sending TU. 

The simulator supports ESM (Enter to Send Message), means hitting the Enter key will allow you to send messages depending on the state of the QSO. Details on ESM can be found: [here](#esm-enter-to-send-message).

As in the real world stations that are sending will not listen what you are sending. Hence you need to wait until the DX station has finished sending before you reply.

## Operating systems
Web Morse Runner is tested successful to work on **Mac**/**Windows 11** and **Linux**. 
Main Browser is **Chrome**, but **Edge** and **Firefox** and **Safari** are also reported to work.
Please understand that the author can not test all combinations of Operating Systems and Browsers on each change.

*Usage in iOS*: the author of this project could run Web Morse Runner various iOS Devices (iPhone/iPad) using Safari and Chrome. In order to use Web Morse Runner you can connect am external BT Keyboard.
In order to hear the sound, double check that the silent mode is not active and the volume is set. Make sure in the Energie setting that you contest is not interrupted. Instead of function key usage it might be useful to press the F1-8 buttons in Web Morse Runner to key the session active.


## Settings
The settings you make in Web Morse Runner will be stored the your own browsers local storage.

* **Call** Your own call sign.
* **QSK** If selected the system will very fast switch between transmit and listening, so that you can hear the band activity between each dit/dah.
* **CW Speed** This is your sending speed. All calling stations will respond slower.
* **Pitch** The frequency of your side tone.
* **RX Bandwidth** The filter bandwidth applied. Do not make this value to small or you might not hear calling stations outside the filter range.
* **Mon. Level** The volume of your own side tone. Use your system audio level to control the overall volume.
* **RIT** The RIT value. Move slider to move RIT up/down in frequency.

## Band Conditions

* **QRM** Interference form other running stations occurs from time to time.
* **QRN** Electrostatic interference.
* **QSB** signal strength varies with time.
* **Flutter** Some stations have "auroral" sound.
* **LIDS** Some stations call you when you are working another station, make mistakes when they send code, copy your messages incorrectly, and send RST other than 599.

## Upload Calls
Since release 0.05 Web Morse Runner will cache the call sign information that is stored in calls.txt in the browser local storage. The calls.txt file reloaded when you clear the local storage, or if you press the **reload** link.
You can also provide your own call signs via file upload by pressing the  **upload** link.
The file you load load must be a standard text file containing one line per call.
Please notice that the upload format might change in future. 

The file format for the call signs file is very simple. Some examples can be found in the github repository (Folder Example_Calls).


## Contest Modes

Web Morse Runner supports the following contest modes:
* **Single Call** Always one station is calling to you. No pileup and you not need to call CQ.
* **Pileup** In this station you need to call CQ first before stations will reply. The parameter *Activity* will determine how many stations will answer in average. The number of stations calling you will be displayed over the running clock.
* **DARC CWA** (EXPERIMENTAL) Exchange is DOK. You need to [upload](#upload-calls) calls with file [DL-All_DOK.txt](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/DL-All_DOK.txt) that contain necessary DOK information for stations. Notice the points are still calculated by prefix not DOK, this might be later updated.
* **AWT** (EXPERIMENTAL) Exchange is the name. You need to [upload](#upload-calls) [AWT.txt](https://raw.githubusercontent.com/fritzsche/WebMorseRunner/refs/heads/main/Example_Calls/AWT.txt) that contain necessary example calls with names. The point calculation is still bases on prefix. This might be later added.

## Pileup
To master pileup it is helpful to pick station by station. Typically you can start with station calling on frequency that you copy the best.
To pick a singe station you can use the question mark. 
For example, if you enter DJ1? into the Call field and his **Enter** to send, only stations starting with DJ1 would reply.

Notice that station will already recognize partial matches of their call, e.g. if you misspelled only 1-2 characters, the DX station will try to send the correct call again.


## Keyboard
The main usage of Web Morse Runner is via the keyboard. 
### Function Key
The function keys F1-F8 are used to send various messages. The assigned messages are fixed assigned and visible on the main screen. 
Modern operating systems however are reusing function keys for all kind of purpose, e.g. to control the volume or brightness of the display. The get them working as function keys you might need to execute some settings in your operating setting or keyboard.


#### macOS Ventura or later
1) Choose Apple menu -> System Settings.
2) Click Keyboard in the sidebar.
3) Click the Keyboard Shortcuts button on the right.
4) Click Function Keys in the sidebar.
5) Turn on "Use F1, F2, etc, keys as standard function keys".

#### Windows 11
There are different ways to activate function keys on Windows. The authors machine supported Fn-Key. Pressing Fm-Key and the "lock-symbol" key (on Esc key). Locked the Function keys permanent into place. Others describe that Bios or UEFI settings work or a Lock key using control panel.


#### Chrome and F7
In the google chrome browser the **F7** key is used to activate "Caret Browsing".
The author of Web Morse Runner is not using Caret Browser and simply switched it of and ticked the checkbox to not ask again. Now the **F7** key is used to send the question mark.


#### Use Number keys
On some platforms for example mobile it's difficult to use Function Keys. Instead of pressing function key you can press CTRL-1 / Meta-1 / Alt-1 / Numpad 1 for F1 and CTRL-2 / Meta-2 / Alt-2 / Numpad 2 for F2 etc.

### Supported Keyboard Shortcuts

#### ESM Enter to Send Message
The main usage of Web Morse Runner is via ESM.
This means after stating the contest the cursor is places automatically in the Call fields.

* To call CQ you only need to press the **Enter**-Key. 
* Once station reply, you enter the call sign into the call fields where your cursor is already located.
* Hit **Enter** again. Web Morse Runner will send the report 599 and your running number. The cursor will be automatic advanced to the NR field.
* Now listen and enter the number in the NR field that your curser is automatic advanced already.
* Hit **Enter** again and Web Morse Runner will finalize the QSO by sending **TU**,
* After the QSO is final, the fields Call, RST and NR are wiped automatically and the cursor is put into the fields Call again. So you can continue with the next QSO. 

#### Other keyboard  

* **TAB**: move cursor between fields Call->RST->NR. If the cursor is in the NR fields another TAB should navigate back to Call.
* **Space**: By pressing space the field in focus will be advanced (from call to NR / RST to to NR and NR to call). If RST is empty it will be filled with 599. 
* **Function Keys**
    * **F1**: Call CQ
    * **F2**: Send RST and Number: use it if DX station ask NR? or AGN
    * **F3**: Send TU: used to signal end of QSO to DX station. Might be needed if station did not hear an earlier TU, while you have already logged the contact.
    * **F4**: send your own call: in practice very rare used in Web Morse Runner.
    * **F5**: send DX call: Very useful if station did not understand call, e.g. you doubled with the station. Send his call again to make station send RST and NR.
    * **F6**: B4 - You qso with station before. Very rare use in Web Morse Runner.
    * **F7**: Question mark. You did not complete got the call, a questions mark with make the other station sending you the call again.
    * **F8**: NIL - Indicated the other station that you did not get his call. Very useful in Web Morse Runner when you already send a wrong call sign. The DX stations assumes you have QSO with somebody else and not reply to you. By sending NIL you indicated that could not pick other call, so the DX station will try to send his call again.
* **Arrow-Up/Down** Control the RIT. Station will call you not always on the same frequency. Depending on the filter bandwidth you might not even hear the DX station, or with a very weak signal. Use the Arrow key to move the RIT up/down.
* **Escape** abort sending.



## Version
* **0.9-beta** (2025-12-06) - **Saint Nicholas Day Edition**
   * pressing the escape key will abort the sending
   * TX indicator that
   * updating the call sign is possible after the transmission has started, the update is
   only successful if the changes has not yet been transmitted
* **0.8.4-beta** (2025-12-03)
   * Improve some situation on MacOS where the audio process would not start on Safari and Chrome.
   * On Firefox an MacOS a output sample rate > 48.000 kHz can cause issue. Its advisable to reduce the sample rate accordingly or use Chrome or Safari.
* **0.8.3-beta** (2025-12-02)
   * Fixed a bug reported by Lutz DM6EE as the space key did not work. This was a regression introduced by the adaptation for Android. Thanks for the bug report!
   * Fixed a timing bug that could happen in rared cases during initialization.
* **0.8.2-beta** (2025-05-28)
   * When matching partial call signs the original Morse Runner was not as strict as Web Morse Runner, now Web Morse Runner is relaxed. 
* **0.8.1-beta** (2025-05-27)
   * Two bugs fixed that could cause stations not replying after call with in incomplete call sign.
* **0.8-beta** (2025-05-21)
   * Added HST Mode, grazie Pietro IN3GYO
   * small bug fix
   * (2025-05-22) Fixed bug:
     * Function key F5 is not sending \<his\>.
* **0.7-beta** (2025-04-08) - **Easter Edition**
   * Further internal restructuring of the code to allow different contests.
   * Bugfix: Contest-definition might not load correctly when the configuration is still initial.
   This had been found in Firefox browser as Chrome based browsers seems to slightly different instantiate modules 
   * Experimental support for AWT (A1Club Weekly Contest) and DARC CWA contest
   * (2025-04-13) Fixed some bugs:
      * Avoid additional DX stations are requested while the original request is pending.
      * Some Android devices use different keyboard events (thx TOM DG5CW for reporting).
      * A Bug reading the new contest definition could lead to hidden contest exchange field when the contest is started.
      * Added Alt-Modifier zto simulate function key press


* **0.6-beta** (2025-2-27) - **Carnival Edition**
   * Internal restructuring of the code to allow different contests in future versions
   * Tom (DF7TV) provided an list of Japanese calls based on JJ1WTL's data base. (File JA-All_JJ1QTL)
   * A List of German Calls based of DL6ER's DB is provided (File DL-All_DOK.txt)
   * Mobile usage: if you keep CTRL or Meta pressed you can use the number keys as replacement for the Function Keys. 
   (some mobile platforms do not support function keys). If you have a keyboard with numeric keypad, you can use these key as well.
* **0.5-beta** (2024-12-27) - **お正月 / New Year 2024 Edition** 
   * Added support for Band Conditions QRN, QRM, QSB, Flutter and LID's. 
   * New Keyboard shortcut: The **shift** key is now supported.
   * Calls are now cached in browsers local storage and not reload.
   * Experimental new: Upload your own call file. (Example Calls List contributed by K5GQ)
   * Several important bugfixes.
* **0.4-alpha** (2024-12-15) -- **Christmas 2024 Edition** 
   * Added pileup mode. 
   * Limit tab sequence to fields Call/RST/NR. 
   * Increase size of fields Call/RST/NR
   * Fix various bugs.
* **0.3-alpha** (2024-12-12) Bugfix: Morse Timing fixed including correction of v0.2-alpha.
* **0.2b-alpha** (2024-12-11) The changes in 0.2 cause a regression as there is a audible gap when 2 messages are send after each other. This results from over allocation. Rollback the changes from 0.2-alpha to avoid audible gaps.
* **0.2-alpha** (2024-12-11) Improvement/Bugfix: This JavaScript version used dynamic allocated Array where Pascal was using static sized Array. This is now changed to a pre-allocated Float32Array array to also improve performance to avoid unnecessary allocations in the audio buffer process. In some situations this could leave more spacing.
* **0.1-alpha** (2024-11-25) initial public release.

## References
* [Morse Runner](https://github.com/VE3NEA/MorseRunner) (Windows/Pascal) by VE3NEA - Alex Shovkoplyas
* [Morse Runner Community Edition](https://groups.io/g/MorseRunnerCE)
* [Morse Runner Port](https://github.com/fritzsche/MorseRunner) (Linux/Mac) adopted by DJ1TF  - Thomas Fritzsche


## Thanks
Like to thank VE3NEA Alex Shovkoplyas for his inspiring work on Morse Runner.




73, Thomas - DJ1TF



