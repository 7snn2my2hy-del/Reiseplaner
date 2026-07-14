# Reisen – Einrichtung, Cloud-Backup & FaceID

Diese App läuft komplett im Browser und speichert alle Daten (inkl. Referenzfotos) lokal auf deinem Gerät. Für ein automatisches, verschlüsseltes Cloud-Backup und die FaceID-Sperre muss die App über eine `https://`-Adresse laufen – am einfachsten über **GitHub Pages**.

---

## 1. Dateien ins Repository legen

Lege diese Dateien in den Wurzelordner deines Repositorys (z. B. `reisen`):

- `index.html` – die App
- `manifest.json` – App-Manifest (Name, Icon, Standalone-Modus)
- `sw.js` – Service Worker (macht die App offline nutzbar)
- `CLOUD-BACKUP-ANLEITUNG.md` – diese Anleitung

**Wichtig:** Die App-Datei muss `index.html` heißen, damit Manifest, Service Worker und FaceID sauber funktionieren.

## 2. GitHub Pages aktivieren

1. Repository → **Settings → Pages**
2. Unter „Build and deployment" → Source: **Deploy from a branch**
3. Branch: `main`, Ordner: `/ (root)` → **Save**
4. Nach ein bis zwei Minuten ist die App unter
   `https://<benutzername>.github.io/reisen/` erreichbar.

## 3. Als App installieren (iPhone)

1. Öffne die Adresse in **Safari**
2. Teilen-Symbol → **Zum Home-Bildschirm**
3. Ab jetzt startet „Reisen" wie eine echte App – und **FaceID-Sperre** sowie **Offline-Nutzung** sind verfügbar.

---

## 4. Verschlüsseltes Cloud-Backup einrichten

Das Backup verschlüsselt deine Daten **auf dem Gerät** (AES-256-GCM, Schlüssel aus deiner Passphrase via PBKDF2) und legt nur den unlesbaren Chiffretext als `backup.enc.json` in einem **privaten** GitHub-Repo ab. Ohne deine Passphrase kann niemand die Daten lesen – auch GitHub nicht.

### 4.1 Privates Backup-Repository anlegen

Lege ein **eigenes, privates** Repo an, z. B. `reisen-backup`. (Nicht dasselbe wie das öffentliche Pages-Repo – das Backup gehört in ein privates Repo.)

### 4.2 Fine-grained Token erstellen

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access:** Only select repositories → dein `reisen-backup`
3. **Permissions → Repository permissions → Contents:** **Read and write**
4. Token generieren und **kopieren** (wird nur einmal angezeigt).

### 4.3 In der App eintragen

1. App → Zahnrad → **Cloud-Backup** antippen
2. **Repository:** `<benutzername>/reisen-backup`
3. **GitHub-Token:** den gerade erstellten Token einfügen
4. **Passphrase:** ein Passwort, das nur du kennst (unbedingt merken!)
5. **Automatisch sichern** aktiviert lassen → **Jetzt sichern**

Ab jetzt wird ~30 Sekunden nach jeder Änderung automatisch gesichert.

## 5. Auf einem neuen Gerät wiederherstellen

1. App öffnen → Zahnrad → **Cloud-Backup**
2. Dasselbe Repository, denselben Token und **dieselbe Passphrase** eintragen
3. **Aus Cloud laden** → die Daten werden entschlüsselt und übernommen.

---

## Hinweise

- **Bilder:** Referenzfotos werden in einer lokalen Datenbank (IndexedDB) auf dem Gerät gespeichert – deutlich mehr Platz als der normale Browser-Speicher, sodass hunderte komprimierte Fotos möglich sind. Beim Cloud-Backup werden die Bilder automatisch mitgesichert und beim Wiederherstellen zurückgeschrieben.
- **Passphrase-Verlust = Datenverlust:** Ohne die Passphrase lässt sich ein Cloud-Backup nicht entschlüsseln. Es gibt keine Wiederherstellung.
- **FaceID** ist ein Sichtschutz gegen beiläufigen Zugriff. Die lokalen Daten selbst bleiben unverschlüsselt auf dem Gerät – der eigentliche Schutz für den Ernstfall ist das verschlüsselte Cloud-Backup.
- **Token sicher halten:** Der Token erlaubt Schreibzugriff auf das Backup-Repo. Bei Verdacht auf Missbrauch in den GitHub-Einstellungen widerrufen und einen neuen erstellen.
- **Service Worker aktualisieren:** Nach einem App-Update die Versionsnummer in `sw.js` (`reisen-v1` → `reisen-v2` …) erhöhen, damit installierte Geräte die neue Version laden.
