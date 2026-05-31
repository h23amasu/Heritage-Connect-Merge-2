# Integritet och personuppgifter – Heritage Connect

Kort referens för teamet och presentationen. Fullständig text för slutanvändare finns i prenumerationsflödet (integritetspolicyn i modalen).

## Vad vi samlar in

| Uppgift | Syfte |
|---------|--------|
| Mobilnummer och/eller e-post | Skicka notiser (SMS/e-post) |
| Aktuell position | Geofencing – meddelande när användaren är nära ett världsarv |
| Hemposition (ungefärlig) | Undvika upprepade notiser vid pendling/vardag |
| Senaste position | Geofencing och hemzonslogik |
| Språkpreferens | Rätt språk i meddelanden och innehåll |
| Besökta världsarv (valfritt) | Innehållspreferenser i profilen |

All insamling sker med **samtycke** (kryss i prenumerationsflödet).

## Vad vi inte gör

- Ingen reklam utifrån platsdata
- Ingen spårning för andra syften än tjänsten
- Kortuppgifter lagras **inte** hos Heritage Connect (Stripe hanterar betalning)

## Lagring

- Kontaktuppgifter och positionsdata sparas **medan prenumerationen är aktiv**
- Avslutad prenumeration = inga fler notiser
- Full radering av uppgifter sker på **begäran** (via tidning/support) – automatisk radering vid avslut är inte implementerad ännu

## Tredje parter

| Leverantör | Roll |
|------------|------|
| **Stripe** | Betalning (Visa/Mastercard) |
| **HelloSMS** | SMS-leverans |
| **SendGrid** | E-post (kvitton, engångskoder) |
| **Railway** | Hosting av app och API |

## Användarens rättigheter

- Avsluta prenumeration när som helst (profil)
- Pausa notiser (profil)
- Begära radering av uppgifter (kontakt)
- Ändra kontaktuppgifter (profil)

## 30 sekunder inför presentation

> *"Heritage Connect samlar telefon och plats med användarens samtycke – bara för att skicka SMS eller e-post om världsarv i närheten, inte för reklam. Vi kan spara hemposition medan prenumerationen är aktiv så att man inte får samma meddelande varje dag på pendlingen. Betalning går via Stripe, meddelanden via HelloSMS och SendGrid, och servern ligger hos Railway. Användaren kan avsluta när som helst."*

## Teknisk referens (kod)

- Användarmodell: `app/models/user.py` (`home_latitude`, `last_latitude`, m.m.)
- Geofencing: `app/services/geofencing_service.py`
- Integritetstext i UI: `index.html` (steg 2, policy-ruta)
