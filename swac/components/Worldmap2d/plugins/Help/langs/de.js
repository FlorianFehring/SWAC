var Worldmap2d_Help_de = {
  title: 'Hilfe',
  plugin_title: 'Plugins',
  plugin_text: 'Öffnet sich durch ein Plugin ein Fenster, sollte ein Klick außerhalb des Fensters ausreichen, um dieses zu schließen.',
  search_title: 'Suche',
  search_text: 'Ein Klick auf die Lupe öffnet ein Textfeld, in das der Name eines Ortes eingegeben werden kann. Mit einem Klick auf die Lupe rechts neben dem Textfeld wird dann nach diesem Ort gesucht.',
  filtermeasurementpoints_title: 'Messpunkttype filtern',
  filtermeasurementpoints_text: 'Mit einem Klick auf den Filter wird ein Menü mit einer Select-Box geöffnet, in dem ein Messpunkttyp, nach dem gefiltert werden soll, ausgewählt werden kann. Nach dem Filtern werden nur noch die Messpunkte angezeigt, die eben jenen Messpunkttypen besitzen.',
  click_map_title: 'Klick in die Karte',
  click_map_on_text: 'Aktuell sind die Klick-Events eingeschaltet. Mit einem Klick auf den Knopf werden diese ausgeschaltet.',
  click_map_off_text: 'Aktuell sind die Klick-Events ausgeschaltet. Mit einem Klick auf den Knopf werden diese eingeschaltet.',
  location_title: 'Verfolge meinen Standort',
  location_on_text: 'Gibt es ein Update für den Standort des Nutzers, zentriert sich die Karte auf diesen Standort. Durch einen Klick auf den Knopf wird diese Funktion ausgeschaltet.',
  location_off_text: 'Die Karte zentriert sich bei einem Update für den Standort des Nutzers nicht auf diesen. Durch einen Klick auf den Knopf die Standortverfolgung eingeschaltet.',
  magicmapper_title: 'Magic Mapper',
  magicmapper_wand_off_text: 'Momentan wird nicht versucht, eine Verbindung mit dem MagicMapper aufzunehmen. Mit einem Klick wird ein Eingabefeld geöffnet, in das man die IP-Adresse des Raspberry-Pis eingeben kann. Nach Bestätigung wird versucht, die Verbindung mit dem Raspberry-Pi aufzubauen.',
  magicmapper_wand_on_text: 'Die Verbindung mit dem MagicMapper besteht und es werden erfolgreich Daten empfangen. Mit einem Klick wird diese Verbindung beendet.',
  magicmapper_skull_text: 'Die Verbindung mit dem Raspberry-Pi war erfolgreich. Dieser hat jedoch aktuell keine Verbindung zum MagicMapper.',
  magicmapper_hourglass_text: 'Die Verbindung mit dem Raspberry-Pi wird momentan aufgebaut.',
  magicmapper_instructions_title: 'MagicMapper-Anleitung',
  magicmapper_instructions_step1: 'Um den MagicMapper nutzen zu können, muss zuallererst der MagicMapper eingeschaltet werden. Wenn dieser gestartet ist, muss der Raspberry-Pi gestartet werden. Dieser verbindet sich im Anschluss automatisch mit dem angeschlossenen MagicMapper und empfängt ab dann die Daten, die über die Applikation abgefragt werden können.',
  magicmapper_instructions_step2: 'Zu beachten ist, dass sich der MagicMapper nach dem Start erst “kalibrieren” muss. Währenddessen enthalten die empfangenen Daten nur Nullen als Koordinaten. Sie müssen nichts tun, dies kann allerdings bis zu 30 Sekunden dauern.',
  magicmapper_instructions_step3: 'Sind der MagicMapper und der Raspberry-Pi gestartet, kann versucht werden, die Verbindung zwischen dem Raspberry-Pi und der Applikation herzustellen.',
  magicmapper_instructions_step4: 'Dazu muss im MagicMapper-Untermenü die IP-Adresse des Raspberry-Pis eingegeben werden. Wird der MagicMapper zum ersten Mal in diesem Browser genutzt, muss zunächst ein (provisorisches) Sicherheitszertifikat akzeptiert werden. Der Button "Zertifikat akzeptieren" öffnet die Seite zum Akzeptieren des Zertifikats in einem neuen Tab.',
  magicmapper_instructions_step5: 'Nachdem das Zertifikat akzeptiert wurde, kann aus dem gleichen Untermenü eine Verbindungsaufnahme gestartet werden. Ist diese erfolgreich, werden regelmäßig Positionsdaten empfangen, bis die Verbindung wieder unterbrochen wird.',
  magicmapper_instructions_step6: 'Ist die Verbindungsaufnahme nicht erfolgreich, sollte überprüft werden, ob die IP-Adresse korrekt eingegeben wurde bzw. ob der Raspberry-Pi bereit ist, eine Verbindungsaufnahme zu starten. Eventuell kann ein Neustart des Raspberry-Pis das Problem beheben.'
};

export default Worldmap2d_Help_de;
