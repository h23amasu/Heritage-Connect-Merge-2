/**
 * Landningssida fran SMS-lank: /sites/{unesco_id}
 * Lang UNESCO-text som stycken – inga delrubriker, bara styckindelning.
 */
(function () {
  const pathMatch = window.location.pathname.match(/\/sites\/([^/]+)/);
  const siteRef = pathMatch ? decodeURIComponent(pathMatch[1]) : "";
  const READER_LANG_STORAGE_KEY = "heritage_connect_reader_lang";

  const LANDING_UI = {
    sv: {
      NEAR_SITE: "Du är nära ett UNESCO-världsarv",
      TO_NEWSPAPER: "Till tidningen",
      LOADING_SITE: "Laddar plats…",
      AI_TITLE: "Fråga AI om detta världsarv",
      AI_HELP:
        "AI:n läser hela din fråga och svarar från UNESCO:s långa källtexter ovan – inga gissningar. Fråga t.ex. om Parthenon, demokrati, eller när platsen blev världsarv.",
      AI_PLACEHOLDER: "Vad är unikt med detta världsarv?",
      AI_ASK_BTN: "Fråga",
      MANAGE_PROFILE: "Hantera prenumeration och profil",
      SITE_NOT_FOUND: "Platsen kunde inte hittas.",
      GO_TO_HC: "Gå till Heritage Connect",
      LOADING_UNESCO: "Laddar UNESCO-text…",
      LOADING_UNESCO_PROGRESS: "Laddar UNESCO-text ({current}/{total})…",
      NO_DESCRIPTION: "Ingen beskrivning tillgänglig.",
      UNESCO_LOAD_ERROR:
        "Kunde inte visa hela UNESCO-texten just nu. Du kan fortfarande ställa frågor till AI nedan.",
      WORLD_HERITAGE: "Världsarv",
      ASK_FIRST: "Skriv en fråga först.",
      SITE_STILL_LOADING: "Platsen laddas fortfarande – vänta ett ögonblick.",
      AI_SEARCHING: "AI söker svar…",
      NO_AI_ANSWER: "Inget svar tillgängligt.",
      AI_TIMEOUT: "Tidsgräns (60 s). Försök igen.",
      AI_NETWORK_ERROR:
        "Kunde inte nå {base}. Öppna sidan via Railway eller starta backend på port 8000 (inte Live Server).",
      AI_ERROR_PREFIX: "Kunde inte nå AI:",
    },
    en: {
      NEAR_SITE: "You are near a UNESCO World Heritage site",
      TO_NEWSPAPER: "Back to the newspaper",
      LOADING_SITE: "Loading site…",
      AI_TITLE: "Ask AI about this World Heritage site",
      AI_HELP:
        "The AI reads your full question and answers from UNESCO's long source texts above – no guessing. Ask about the Parthenon, democracy, or when the site became World Heritage.",
      AI_PLACEHOLDER: "What makes this World Heritage site unique?",
      AI_ASK_BTN: "Ask",
      MANAGE_PROFILE: "Manage subscription and profile",
      SITE_NOT_FOUND: "The site could not be found.",
      GO_TO_HC: "Go to Heritage Connect",
      LOADING_UNESCO: "Loading UNESCO text…",
      LOADING_UNESCO_PROGRESS: "Loading UNESCO text ({current}/{total})…",
      NO_DESCRIPTION: "No description available.",
      UNESCO_LOAD_ERROR:
        "Could not show the full UNESCO text right now. You can still ask the AI below.",
      WORLD_HERITAGE: "World Heritage site",
      ASK_FIRST: "Type a question first.",
      SITE_STILL_LOADING: "The site is still loading – please wait a moment.",
      AI_SEARCHING: "AI is searching for an answer…",
      NO_AI_ANSWER: "No answer available.",
      AI_TIMEOUT: "Time limit (60 s). Please try again.",
      AI_NETWORK_ERROR:
        "Could not reach {base}. Open the page via Railway or start the backend on port 8000 (not Live Server).",
      AI_ERROR_PREFIX: "Could not reach AI:",
    },
    it: {
      NEAR_SITE: "Sei vicino a un sito del patrimonio mondiale UNESCO",
      TO_NEWSPAPER: "Vai al giornale",
      LOADING_SITE: "Caricamento del sito…",
      AI_TITLE: "Chiedi all'IA su questo sito del patrimonio mondiale",
      AI_HELP:
        "L'IA legge l'intera domanda e risponde dai lunghi testi fonte UNESCO sopra – nessuna supposizione. Chiedi ad esempio del Partenone, della democrazia o di quando il sito è diventato patrimonio mondiale.",
      AI_PLACEHOLDER: "Cosa rende unico questo sito del patrimonio mondiale?",
      AI_ASK_BTN: "Chiedi",
      MANAGE_PROFILE: "Gestisci abbonamento e profilo",
      SITE_NOT_FOUND: "Il sito non è stato trovato.",
      GO_TO_HC: "Vai a Heritage Connect",
      LOADING_UNESCO: "Caricamento testo UNESCO…",
      LOADING_UNESCO_PROGRESS: "Caricamento testo UNESCO ({current}/{total})…",
      NO_DESCRIPTION: "Nessuna descrizione disponibile.",
      UNESCO_LOAD_ERROR:
        "Impossibile mostrare l'intero testo UNESCO al momento. Puoi comunque porre domande all'IA qui sotto.",
      WORLD_HERITAGE: "Patrimonio mondiale",
      ASK_FIRST: "Scrivi prima una domanda.",
      SITE_STILL_LOADING: "Il sito è ancora in caricamento – attendi un momento.",
      AI_SEARCHING: "L'IA sta cercando una risposta…",
      NO_AI_ANSWER: "Nessuna risposta disponibile.",
      AI_TIMEOUT: "Limite di tempo (60 s). Riprova.",
      AI_NETWORK_ERROR:
        "Impossibile raggiungere {base}. Apri la pagina tramite Railway o avvia il backend sulla porta 8000 (non Live Server).",
      AI_ERROR_PREFIX: "Impossibile raggiungere l'IA:",
    },
    es: {
      NEAR_SITE: "Estás cerca de un sitio del Patrimonio Mundial de la UNESCO",
      TO_NEWSPAPER: "Ir al periódico",
      LOADING_SITE: "Cargando el sitio…",
      AI_TITLE: "Pregunta a la IA sobre este Patrimonio Mundial",
      AI_HELP:
        "La IA lee toda tu pregunta y responde a partir de los largos textos fuente de la UNESCO arriba, sin adivinar. Pregunta por el Partenón, la democracia o cuándo el sitio fue declarado patrimonio.",
      AI_PLACEHOLDER: "¿Qué hace único este Patrimonio Mundial?",
      AI_ASK_BTN: "Preguntar",
      MANAGE_PROFILE: "Gestionar suscripción y perfil",
      SITE_NOT_FOUND: "No se encontró el sitio.",
      GO_TO_HC: "Ir a Heritage Connect",
      LOADING_UNESCO: "Cargando texto UNESCO…",
      NO_DESCRIPTION: "No hay descripción disponible.",
      UNESCO_LOAD_ERROR:
        "No se pudo mostrar todo el texto UNESCO ahora. Aún puedes hacer preguntas a la IA abajo.",
      WORLD_HERITAGE: "Patrimonio Mundial",
      ASK_FIRST: "Escribe una pregunta primero.",
      SITE_STILL_LOADING: "El sitio aún se está cargando – espera un momento.",
      AI_SEARCHING: "La IA busca una respuesta…",
      NO_AI_ANSWER: "No hay respuesta disponible.",
      AI_TIMEOUT: "Límite de tiempo (60 s). Inténtalo de nuevo.",
      AI_NETWORK_ERROR:
        "No se pudo contactar con {base}. Abre la página vía Railway o inicia el backend en el puerto 8000 (no Live Server).",
      AI_ERROR_PREFIX: "No se pudo contactar con la IA:",
    },
    fr: {
      NEAR_SITE: "Vous êtes près d'un site du patrimoine mondial de l'UNESCO",
      TO_NEWSPAPER: "Retour au journal",
      LOADING_SITE: "Chargement du site…",
      AI_TITLE: "Interroger l'IA sur ce patrimoine mondial",
      AI_HELP:
        "L'IA lit toute votre question et répond à partir des longs textes sources UNESCO ci-dessus – sans deviner. Posez des questions sur le Parthénon, la démocratie ou la date d'inscription.",
      AI_PLACEHOLDER: "Qu'est-ce qui rend unique ce patrimoine mondial ?",
      AI_ASK_BTN: "Demander",
      MANAGE_PROFILE: "Gérer l'abonnement et le profil",
      SITE_NOT_FOUND: "Le site est introuvable.",
      GO_TO_HC: "Aller sur Heritage Connect",
      LOADING_UNESCO: "Chargement du texte UNESCO…",
      NO_DESCRIPTION: "Aucune description disponible.",
      UNESCO_LOAD_ERROR:
        "Impossible d'afficher tout le texte UNESCO pour l'instant. Vous pouvez toujours poser des questions à l'IA ci-dessous.",
      WORLD_HERITAGE: "Patrimoine mondial",
      ASK_FIRST: "Saisissez d'abord une question.",
      SITE_STILL_LOADING: "Le site se charge encore – patientez un instant.",
      AI_SEARCHING: "L'IA recherche une réponse…",
      NO_AI_ANSWER: "Aucune réponse disponible.",
      AI_TIMEOUT: "Délai dépassé (60 s). Réessayez.",
      AI_NETWORK_ERROR:
        "Impossible de joindre {base}. Ouvrez la page via Railway ou démarrez le backend sur le port 8000 (pas Live Server).",
      AI_ERROR_PREFIX: "Impossible de joindre l'IA :",
    },
    de: {
      NEAR_SITE: "Sie sind in der Nähe einer UNESCO-Welterbestätte",
      TO_NEWSPAPER: "Zur Zeitung",
      LOADING_SITE: "Standort wird geladen…",
      AI_TITLE: "KI zu dieser Welterbestätte fragen",
      AI_HELP:
        "Die KI liest Ihre ganze Frage und antwortet aus den langen UNESCO-Quelltexten oben – ohne zu raten. Fragen Sie z. B. nach dem Parthenon, der Demokratie oder dem Welterbe-Status.",
      AI_PLACEHOLDER: "Was macht diese Welterbestätte einzigartig?",
      AI_ASK_BTN: "Fragen",
      MANAGE_PROFILE: "Abo und Profil verwalten",
      SITE_NOT_FOUND: "Der Standort wurde nicht gefunden.",
      GO_TO_HC: "Zu Heritage Connect",
      LOADING_UNESCO: "UNESCO-Text wird geladen…",
      NO_DESCRIPTION: "Keine Beschreibung verfügbar.",
      UNESCO_LOAD_ERROR:
        "Der vollständige UNESCO-Text kann gerade nicht angezeigt werden. Sie können unten weiter Fragen an die KI stellen.",
      WORLD_HERITAGE: "Welterbe",
      ASK_FIRST: "Bitte zuerst eine Frage eingeben.",
      SITE_STILL_LOADING: "Der Standort wird noch geladen – bitte kurz warten.",
      AI_SEARCHING: "KI sucht eine Antwort…",
      NO_AI_ANSWER: "Keine Antwort verfügbar.",
      AI_TIMEOUT: "Zeitlimit (60 s). Bitte erneut versuchen.",
      AI_NETWORK_ERROR:
        "Verbindung zu {base} fehlgeschlagen. Seite über Railway öffnen oder Backend auf Port 8000 starten (nicht Live Server).",
      AI_ERROR_PREFIX: "KI nicht erreichbar:",
    },
    ar: {
      NEAR_SITE: "أنت قريب من موقع تراث عالمي لليونسكو",
      TO_NEWSPAPER: "إلى الصحيفة",
      LOADING_SITE: "جارٍ تحميل الموقع…",
      AI_TITLE: "اسأل الذكاء الاصطناعي عن هذا التراث العالمي",
      AI_HELP:
        "يقرأ الذكاء الاصطناعي سؤالك كاملاً ويجيب من نصوص اليونسكو الطويلة أعلاه دون تخمين. اسأل عن البارثينون أو الديمقراطية أو متى أصبح الموقع تراثاً عالمياً.",
      AI_PLACEHOLDER: "ما الذي يجعل هذا التراث العالمي فريداً؟",
      AI_ASK_BTN: "اسأل",
      MANAGE_PROFILE: "إدارة الاشتراك والملف الشخصي",
      SITE_NOT_FOUND: "تعذر العثور على الموقع.",
      GO_TO_HC: "انتقل إلى Heritage Connect",
      LOADING_UNESCO: "جارٍ تحميل نص اليونسكو…",
      NO_DESCRIPTION: "لا يوجد وصف متاح.",
      UNESCO_LOAD_ERROR:
        "تعذر عرض نص اليونسكو الكامل الآن. لا يزال بإمكانك طرح الأسئلة على الذكاء الاصطناعي أدناه.",
      WORLD_HERITAGE: "تراث عالمي",
      ASK_FIRST: "اكتب سؤالاً أولاً.",
      SITE_STILL_LOADING: "الموقع لا يزال قيد التحميل – انتظر لحظة.",
      AI_SEARCHING: "الذكاء الاصطناعي يبحث عن إجابة…",
      NO_AI_ANSWER: "لا توجد إجابة متاحة.",
      AI_TIMEOUT: "انتهت المهلة (60 ث). حاول مرة أخرى.",
      AI_NETWORK_ERROR:
        "تعذر الوصول إلى {base}. افتح الصفحة عبر Railway أو شغّل الخادم على المنفذ 8000.",
      AI_ERROR_PREFIX: "تعذر الوصول إلى الذكاء الاصطناعي:",
    },
    ru: {
      NEAR_SITE: "Вы рядом с объектом всемирного наследия ЮНЕСКО",
      TO_NEWSPAPER: "К газете",
      LOADING_SITE: "Загрузка объекта…",
      AI_TITLE: "Спросить ИИ об этом объекте наследия",
      AI_HELP:
        "ИИ читает весь ваш вопрос и отвечает по длинным исходным текстам ЮНЕСКО выше — без догадок. Спросите о Парфеноне, демократии или о дате включения в список.",
      AI_PLACEHOLDER: "Что делает этот объект наследия уникальным?",
      AI_ASK_BTN: "Спросить",
      MANAGE_PROFILE: "Управление подпиской и профилем",
      SITE_NOT_FOUND: "Объект не найден.",
      GO_TO_HC: "Перейти в Heritage Connect",
      LOADING_UNESCO: "Загрузка текста ЮНЕСКО…",
      NO_DESCRIPTION: "Описание недоступно.",
      UNESCO_LOAD_ERROR:
        "Сейчас не удалось показать полный текст ЮНЕСКО. Вы всё ещё можете задать вопросы ИИ ниже.",
      WORLD_HERITAGE: "Объект наследия",
      ASK_FIRST: "Сначала введите вопрос.",
      SITE_STILL_LOADING: "Объект ещё загружается — подождите немного.",
      AI_SEARCHING: "ИИ ищет ответ…",
      NO_AI_ANSWER: "Ответ недоступен.",
      AI_TIMEOUT: "Превышено время (60 с). Попробуйте снова.",
      AI_NETWORK_ERROR:
        "Не удалось связаться с {base}. Откройте страницу через Railway или запустите backend на порту 8000.",
      AI_ERROR_PREFIX: "Не удалось связаться с ИИ:",
    },
    zh: {
      NEAR_SITE: "您靠近联合国教科文组织世界遗产地",
      TO_NEWSPAPER: "返回报纸",
      LOADING_SITE: "正在加载地点…",
      AI_TITLE: "向 AI 询问此世界遗产",
      AI_HELP:
        "AI 会阅读您的完整问题，并根据上方的联合国教科文组织长文作答，不会猜测。可询问帕特农神庙、民主或列入世界遗产的时间等。",
      AI_PLACEHOLDER: "这一世界遗产有何独特之处？",
      AI_ASK_BTN: "提问",
      MANAGE_PROFILE: "管理订阅与个人资料",
      SITE_NOT_FOUND: "找不到该地点。",
      GO_TO_HC: "前往 Heritage Connect",
      LOADING_UNESCO: "正在加载联合国教科文组织文本…",
      NO_DESCRIPTION: "暂无描述。",
      UNESCO_LOAD_ERROR: "暂时无法显示完整的联合国教科文组织文本。您仍可在下方向 AI 提问。",
      WORLD_HERITAGE: "世界遗产",
      ASK_FIRST: "请先输入问题。",
      SITE_STILL_LOADING: "地点仍在加载，请稍候。",
      AI_SEARCHING: "AI 正在搜索答案…",
      NO_AI_ANSWER: "暂无答案。",
      AI_TIMEOUT: "超时（60 秒）。请重试。",
      AI_NETWORK_ERROR: "无法连接 {base}。请通过 Railway 打开页面或在 8000 端口启动后端。",
      AI_ERROR_PREFIX: "无法连接 AI：",
    },
    fi: {
      NEAR_SITE: "Olet lähellä UNESCO:n maailmanperintökohdetta",
      TO_NEWSPAPER: "Takaisin lehteen",
      LOADING_SITE: "Ladataan kohdetta…",
      AI_TITLE: "Kysy tekoälyltä tästä maailmanperinnöstä",
      AI_HELP:
        "Tekoäly lukee koko kysymyksesi ja vastaa yllä olevista UNESCO-lähdeteksteistä – ei arvauksia. Kysy esim. Parthenonista, demokratiasta tai milloin kohde listattiin.",
      AI_PLACEHOLDER: "Mikä tekee tästä maailmanperinnöstä ainutlaatuisen?",
      AI_ASK_BTN: "Kysy",
      MANAGE_PROFILE: "Hallitse tilausta ja profiilia",
      SITE_NOT_FOUND: "Kohdetta ei löytynyt.",
      GO_TO_HC: "Siirry Heritage Connectiin",
      LOADING_UNESCO: "Ladataan UNESCO-tekstiä…",
      NO_DESCRIPTION: "Kuvausta ei saatavilla.",
      UNESCO_LOAD_ERROR:
        "Koko UNESCO-tekstiä ei voitu näyttää juuri nyt. Voit silti kysyä tekoälyltä alla.",
      WORLD_HERITAGE: "Maailmanperintö",
      ASK_FIRST: "Kirjoita ensin kysymys.",
      SITE_STILL_LOADING: "Kohde latautuu vielä – odota hetki.",
      AI_SEARCHING: "Tekoäly etsii vastausta…",
      NO_AI_ANSWER: "Vastausta ei saatavilla.",
      AI_TIMEOUT: "Aikaraja (60 s). Yritä uudelleen.",
      AI_NETWORK_ERROR:
        "Yhteys kohteeseen {base} epäonnistui. Avaa sivu Railwayn kautta tai käynnistä backend portissa 8000.",
      AI_ERROR_PREFIX: "Tekoälyyn ei saatu yhteyttä:",
    },
    pt: {
      NEAR_SITE: "Você está perto de um Património Mundial da UNESCO",
      TO_NEWSPAPER: "Ir para o jornal",
      LOADING_SITE: "A carregar o local…",
      AI_TITLE: "Pergunte à IA sobre este Património Mundial",
      AI_HELP:
        "A IA lê toda a sua pergunta e responde com base nos longos textos fonte da UNESCO acima – sem adivinhar. Pergunte sobre o Partenão, democracia ou quando o local foi classificado.",
      AI_PLACEHOLDER: "O que torna único este Património Mundial?",
      AI_ASK_BTN: "Perguntar",
      MANAGE_PROFILE: "Gerir subscrição e perfil",
      SITE_NOT_FOUND: "O local não foi encontrado.",
      GO_TO_HC: "Ir para Heritage Connect",
      LOADING_UNESCO: "A carregar texto UNESCO…",
      NO_DESCRIPTION: "Sem descrição disponível.",
      UNESCO_LOAD_ERROR:
        "Não foi possível mostrar todo o texto UNESCO agora. Ainda pode fazer perguntas à IA abaixo.",
      WORLD_HERITAGE: "Património Mundial",
      ASK_FIRST: "Escreva primeiro uma pergunta.",
      SITE_STILL_LOADING: "O local ainda está a carregar – aguarde um momento.",
      AI_SEARCHING: "A IA está a procurar uma resposta…",
      NO_AI_ANSWER: "Sem resposta disponível.",
      AI_TIMEOUT: "Limite de tempo (60 s). Tente novamente.",
      AI_NETWORK_ERROR:
        "Não foi possível contactar {base}. Abra a página via Railway ou inicie o backend na porta 8000.",
      AI_ERROR_PREFIX: "Não foi possível contactar a IA:",
    },
    nl: {
      NEAR_SITE: "U bent in de buurt van een UNESCO-werelderfgoedlocatie",
      TO_NEWSPAPER: "Naar de krant",
      LOADING_SITE: "Locatie laden…",
      AI_TITLE: "Vraag AI over dit werelderfgoed",
      AI_HELP:
        "De AI leest uw volledige vraag en antwoordt op basis van de lange UNESCO-bronnen hierboven – geen gissingen. Vraag bijvoorbeeld over het Parthenon, democratie of wanneer de plek werelderfgoed werd.",
      AI_PLACEHOLDER: "Wat maakt dit werelderfgoed uniek?",
      AI_ASK_BTN: "Vragen",
      MANAGE_PROFILE: "Abonnement en profiel beheren",
      SITE_NOT_FOUND: "De locatie is niet gevonden.",
      GO_TO_HC: "Ga naar Heritage Connect",
      LOADING_UNESCO: "UNESCO-tekst laden…",
      NO_DESCRIPTION: "Geen beschrijving beschikbaar.",
      UNESCO_LOAD_ERROR:
        "De volledige UNESCO-tekst kan nu niet worden getoond. U kunt hieronder nog steeds vragen stellen aan de AI.",
      WORLD_HERITAGE: "Werelderfgoed",
      ASK_FIRST: "Typ eerst een vraag.",
      SITE_STILL_LOADING: "De locatie wordt nog geladen – even geduld.",
      AI_SEARCHING: "AI zoekt een antwoord…",
      NO_AI_ANSWER: "Geen antwoord beschikbaar.",
      AI_TIMEOUT: "Tijdslimiet (60 s). Probeer opnieuw.",
      AI_NETWORK_ERROR:
        "Kon {base} niet bereiken. Open de pagina via Railway of start de backend op poort 8000.",
      AI_ERROR_PREFIX: "Kon AI niet bereiken:",
    },
    pl: {
      NEAR_SITE: "Jesteś blisko obiektu dziedzictwa światowego UNESCO",
      TO_NEWSPAPER: "Do gazety",
      LOADING_SITE: "Ładowanie miejsca…",
      AI_TITLE: "Zapytaj AI o to dziedzictwo światowe",
      AI_HELP:
        "AI czyta całe pytanie i odpowiada na podstawie długich tekstów źródłowych UNESCO powyżej – bez zgadywania. Zapytaj np. o Partenon, demokrację lub kiedy miejsce trafiło na listę.",
      AI_PLACEHOLDER: "Co czyni to dziedzictwo wyjątkowym?",
      AI_ASK_BTN: "Zapytaj",
      MANAGE_PROFILE: "Zarządzaj subskrypcją i profilem",
      SITE_NOT_FOUND: "Nie znaleziono miejsca.",
      GO_TO_HC: "Przejdź do Heritage Connect",
      LOADING_UNESCO: "Ładowanie tekstu UNESCO…",
      NO_DESCRIPTION: "Brak opisu.",
      UNESCO_LOAD_ERROR:
        "Nie udało się teraz pokazać pełnego tekstu UNESCO. Nadal możesz zadawać pytania AI poniżej.",
      WORLD_HERITAGE: "Dziedzictwo światowe",
      ASK_FIRST: "Najpierw wpisz pytanie.",
      SITE_STILL_LOADING: "Miejsce wciąż się ładuje – poczekaj chwilę.",
      AI_SEARCHING: "AI szuka odpowiedzi…",
      NO_AI_ANSWER: "Brak odpowiedzi.",
      AI_TIMEOUT: "Limit czasu (60 s). Spróbuj ponownie.",
      AI_NETWORK_ERROR:
        "Nie można połączyć z {base}. Otwórz stronę przez Railway lub uruchom backend na porcie 8000.",
      AI_ERROR_PREFIX: "Nie można połączyć z AI:",
    },
    da: {
      NEAR_SITE: "Du er tæt på et UNESCO-verdensarvssted",
      TO_NEWSPAPER: "Til avisen",
      LOADING_SITE: "Indlæser sted…",
      AI_TITLE: "Spørg AI om dette verdensarv",
      AI_HELP:
        "AI'en læser hele dit spørgsmål og svarer ud fra UNESCO's lange kildetekster ovenfor – ingen gæt. Spørg fx om Parthenon, demokrati eller hvornår stedet blev verdensarv.",
      AI_PLACEHOLDER: "Hvad gør dette verdensarv unikt?",
      AI_ASK_BTN: "Spørg",
      MANAGE_PROFILE: "Administrer abonnement og profil",
      SITE_NOT_FOUND: "Stedet blev ikke fundet.",
      GO_TO_HC: "Gå til Heritage Connect",
      LOADING_UNESCO: "Indlæser UNESCO-tekst…",
      NO_DESCRIPTION: "Ingen beskrivelse tilgængelig.",
      UNESCO_LOAD_ERROR:
        "Kunne ikke vise hele UNESCO-teksten lige nu. Du kan stadig stille spørgsmål til AI nedenfor.",
      WORLD_HERITAGE: "Verdensarv",
      ASK_FIRST: "Skriv et spørgsmål først.",
      SITE_STILL_LOADING: "Stedet indlæses stadig – vent et øjeblik.",
      AI_SEARCHING: "AI søger svar…",
      NO_AI_ANSWER: "Intet svar tilgængeligt.",
      AI_TIMEOUT: "Tidsgrænse (60 s). Prøv igen.",
      AI_NETWORK_ERROR:
        "Kunne ikke nå {base}. Åbn siden via Railway eller start backend på port 8000.",
      AI_ERROR_PREFIX: "Kunne ikke nå AI:",
    },
    no: {
      NEAR_SITE: "Du er nær et UNESCO-verdensarvsted",
      TO_NEWSPAPER: "Til avisen",
      LOADING_SITE: "Laster sted…",
      AI_TITLE: "Spør AI om dette verdensarvet",
      AI_HELP:
        "AI-en leser hele spørsmålet ditt og svarer fra UNESCOs lange kildetekster over – ingen gjetting. Spør f.eks. om Parthenon, demokrati eller når stedet ble verdensarv.",
      AI_PLACEHOLDER: "Hva gjør dette verdensarvet unikt?",
      AI_ASK_BTN: "Spør",
      MANAGE_PROFILE: "Administrer abonnement og profil",
      SITE_NOT_FOUND: "Stedet ble ikke funnet.",
      GO_TO_HC: "Gå til Heritage Connect",
      LOADING_UNESCO: "Laster UNESCO-tekst…",
      NO_DESCRIPTION: "Ingen beskrivelse tilgjengelig.",
      UNESCO_LOAD_ERROR:
        "Kunne ikke vise hele UNESCO-teksten nå. Du kan fortsatt stille spørsmål til AI nedenfor.",
      WORLD_HERITAGE: "Verdensarv",
      ASK_FIRST: "Skriv et spørsmål først.",
      SITE_STILL_LOADING: "Stedet lastes fortsatt – vent et øyeblikk.",
      AI_SEARCHING: "AI søker svar…",
      NO_AI_ANSWER: "Intet svar tilgjengelig.",
      AI_TIMEOUT: "Tidsgrense (60 s). Prøv igjen.",
      AI_NETWORK_ERROR:
        "Kunne ikke nå {base}. Åpne siden via Railway eller start backend på port 8000.",
      AI_ERROR_PREFIX: "Kunne ikke nå AI:",
    },
    ja: {
      NEAR_SITE: "ユネスコ世界遺産の近くにいます",
      TO_NEWSPAPER: "新聞に戻る",
      LOADING_SITE: "サイトを読み込み中…",
      AI_TITLE: "この世界遺産についてAIに質問",
      AI_HELP:
        "AIは質問全体を読み、上のユネスコ長文に基づいて回答します（推測しません）。パルテノン、民主主義、世界遺産登録の時期などを質問できます。",
      AI_PLACEHOLDER: "この世界遺産のユニークな点は？",
      AI_ASK_BTN: "質問",
      MANAGE_PROFILE: "購読とプロフィールを管理",
      SITE_NOT_FOUND: "サイトが見つかりませんでした。",
      GO_TO_HC: "Heritage Connectへ",
      LOADING_UNESCO: "ユネスコテキストを読み込み中…",
      NO_DESCRIPTION: "説明はありません。",
      UNESCO_LOAD_ERROR: "現在、ユネスコ全文を表示できません。下のAIには引き続き質問できます。",
      WORLD_HERITAGE: "世界遺産",
      ASK_FIRST: "まず質問を入力してください。",
      SITE_STILL_LOADING: "サイトを読み込み中です。少々お待ちください。",
      AI_SEARCHING: "AIが回答を検索中…",
      NO_AI_ANSWER: "回答がありません。",
      AI_TIMEOUT: "時間切れ（60秒）。もう一度お試しください。",
      AI_NETWORK_ERROR: "{base} に接続できませんでした。Railway経由で開くか、ポート8000でバックエンドを起動してください。",
      AI_ERROR_PREFIX: "AIに接続できませんでした：",
    },
    ko: {
      NEAR_SITE: "유네스코 세계유산 근처에 있습니다",
      TO_NEWSPAPER: "신문으로",
      LOADING_SITE: "장소 불러오는 중…",
      AI_TITLE: "이 세계유산에 대해 AI에게 질문",
      AI_HELP:
        "AI는 질문 전체를 읽고 위의 유네스코 원문을 바탕으로 답합니다. 파르테논, 민주주의, 세계유산 등재 시기 등을 물어보세요.",
      AI_PLACEHOLDER: "이 세계유산의 독특한 점은?",
      AI_ASK_BTN: "질문",
      MANAGE_PROFILE: "구독 및 프로필 관리",
      SITE_NOT_FOUND: "장소를 찾을 수 없습니다.",
      GO_TO_HC: "Heritage Connect로",
      LOADING_UNESCO: "유네스코 텍스트 불러오는 중…",
      NO_DESCRIPTION: "설명이 없습니다.",
      UNESCO_LOAD_ERROR: "지금은 유네스코 전문을 표시할 수 없습니다. 아래 AI에 계속 질문할 수 있습니다.",
      WORLD_HERITAGE: "세계유산",
      ASK_FIRST: "먼저 질문을 입력하세요.",
      SITE_STILL_LOADING: "장소를 아직 불러오는 중입니다. 잠시만 기다려 주세요.",
      AI_SEARCHING: "AI가 답을 찾는 중…",
      NO_AI_ANSWER: "답변이 없습니다.",
      AI_TIMEOUT: "시간 초과(60초). 다시 시도하세요.",
      AI_NETWORK_ERROR: "{base}에 연결할 수 없습니다. Railway로 열거나 포트 8000에서 백엔드를 시작하세요.",
      AI_ERROR_PREFIX: "AI에 연결할 수 없습니다:",
    },
    tr: {
      NEAR_SITE: "Bir UNESCO Dünya Mirası alanına yakınsınız",
      TO_NEWSPAPER: "Gazeteye dön",
      LOADING_SITE: "Alan yükleniyor…",
      AI_TITLE: "Bu Dünya Mirası hakkında yapay zekaya sor",
      AI_HELP:
        "Yapay zeka tüm sorunuzu okur ve yukarıdaki uzun UNESCO kaynak metinlerinden yanıtlar – tahmin yok. Parthenon, demokrasi veya alanın ne zaman listelendiğini sorun.",
      AI_PLACEHOLDER: "Bu Dünya Mirasını benzersiz kılan nedir?",
      AI_ASK_BTN: "Sor",
      MANAGE_PROFILE: "Abonelik ve profili yönet",
      SITE_NOT_FOUND: "Alan bulunamadı.",
      GO_TO_HC: "Heritage Connect'e git",
      LOADING_UNESCO: "UNESCO metni yükleniyor…",
      NO_DESCRIPTION: "Açıklama yok.",
      UNESCO_LOAD_ERROR:
        "Şu anda tüm UNESCO metni gösterilemedi. Aşağıdaki yapay zekaya yine de soru sorabilirsiniz.",
      WORLD_HERITAGE: "Dünya Mirası",
      ASK_FIRST: "Önce bir soru yazın.",
      SITE_STILL_LOADING: "Alan hâlâ yükleniyor – lütfen bekleyin.",
      AI_SEARCHING: "Yapay zeka yanıt arıyor…",
      NO_AI_ANSWER: "Yanıt yok.",
      AI_TIMEOUT: "Süre sınırı (60 sn). Tekrar deneyin.",
      AI_NETWORK_ERROR:
        "{base} adresine ulaşılamadı. Sayfayı Railway üzerinden açın veya 8000 portunda backend başlatın.",
      AI_ERROR_PREFIX: "Yapay zekaya ulaşılamadı:",
    },
    hi: {
      NEAR_SITE: "आप यूनेस्को विश्व धरोहर स्थल के पास हैं",
      TO_NEWSPAPER: "अख़बार पर जाएँ",
      LOADING_SITE: "स्थल लोड हो रहा है…",
      AI_TITLE: "इस विश्व धरोहर के बारे में AI से पूछें",
      AI_HELP:
        "AI आपका पूरा प्रश्न पढ़कर ऊपर के यूनेस्को स्रोत पाठों से उत्तर देता है – अनुमान नहीं। पार्थेनन, लोकतंत्र या स्थल कब धरोहर बना, पूछ सकते हैं।",
      AI_PLACEHOLDER: "इस विश्व धरोहर को विशिष्ट क्या बनाता है?",
      AI_ASK_BTN: "पूछें",
      MANAGE_PROFILE: "सदस्यता और प्रोफ़ाइल प्रबंधित करें",
      SITE_NOT_FOUND: "स्थल नहीं मिला।",
      GO_TO_HC: "Heritage Connect पर जाएँ",
      LOADING_UNESCO: "यूनेस्को पाठ लोड हो रहा है…",
      NO_DESCRIPTION: "कोई विवरण उपलब्ध नहीं।",
      UNESCO_LOAD_ERROR:
        "अभी पूरा यूनेस्को पाठ नहीं दिखाया जा सका। नीचे AI से अभी भी प्रश्न पूछ सकते हैं।",
      WORLD_HERITAGE: "विश्व धरोहर",
      ASK_FIRST: "पहले एक प्रश्न लिखें।",
      SITE_STILL_LOADING: "स्थल अभी लोड हो रहा है – कृपया प्रतीक्षा करें।",
      AI_SEARCHING: "AI उत्तर खोज रहा है…",
      NO_AI_ANSWER: "कोई उत्तर उपलब्ध नहीं।",
      AI_TIMEOUT: "समय सीमा (60 से.)। पुनः प्रयास करें।",
      AI_NETWORK_ERROR:
        "{base} तक नहीं पहुँच सके। Railway से पृष्ठ खोलें या पोर्ट 8000 पर backend चलाएँ।",
      AI_ERROR_PREFIX: "AI तक नहीं पहुँच सके:",
    },
  };

  function normalizeLanguageCode(value) {
    return String(value || "sv").toLowerCase().slice(0, 2);
  }

  function resolveLandingLang() {
    if (window.__LANDING_LANG__) {
      return normalizeLanguageCode(window.__LANDING_LANG__);
    }
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang) {
      return normalizeLanguageCode(urlLang);
    }
    try {
      const cookieMatch = document.cookie.match(
        /(?:^|;\s*)heritage_connect_reader_lang=([^;]+)/
      );
      if (cookieMatch?.[1]) {
        return normalizeLanguageCode(decodeURIComponent(cookieMatch[1]));
      }
    } catch (_) {
      /* ignore */
    }
    try {
      const sessionStored = sessionStorage.getItem(READER_LANG_STORAGE_KEY);
      if (sessionStored) {
        return normalizeLanguageCode(sessionStored);
      }
      const localStored = localStorage.getItem(READER_LANG_STORAGE_KEY);
      if (localStored) {
        return normalizeLanguageCode(localStored);
      }
    } catch (_) {
      /* ignore */
    }
    return normalizeLanguageCode(document.documentElement.lang || "sv");
  }

  let lang = resolveLandingLang();

  function landingUiPack(code) {
    const normalized = normalizeLanguageCode(code);
    if (
      window.__LANDING_UI_PACK__ &&
      normalized === normalizeLanguageCode(window.__LANDING_LANG__ || lang)
    ) {
      return window.__LANDING_UI_PACK__;
    }
    return LANDING_UI[normalized] || LANDING_UI.en || LANDING_UI.sv;
  }

  function landingT(key, vars) {
    const pack = landingUiPack(lang);
    let text = pack[key] || LANDING_UI.sv[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([name, value]) => {
        text = text.replace(`{${name}}`, String(value));
      });
    }
    return text;
  }

  function applyLandingUiLanguage(targetLang) {
    lang = normalizeLanguageCode(targetLang || lang);
    const root = document.documentElement;
    if (root) {
      root.lang = lang;
    }

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = landingT(key);
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (key) {
        el.setAttribute("placeholder", landingT(key));
      }
    });

    const newspaperLink = document.getElementById("landingNewspaperLink");
    if (newspaperLink) {
      const demoParams = new URLSearchParams();
      if (lang && lang !== "sv") {
        demoParams.set("lang", lang);
      }
      const qs = demoParams.toString();
      newspaperLink.href = qs ? `/demo?${qs}` : "/demo";
    }

    const errorLink = document.getElementById("landingErrorLink");
    if (errorLink) {
      const demoParams = new URLSearchParams();
      if (lang && lang !== "sv") {
        demoParams.set("lang", lang);
      }
      const qs = demoParams.toString();
      errorLink.href = qs ? `/demo?${qs}` : "/demo";
    }
  }

  applyLandingUiLanguage(lang);

  const API_BASE_STORAGE_KEY = "heritage_connect_api_base_url";
  const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

  function normalizeApiBaseUrl(raw) {
    if (!raw || !String(raw).trim()) {
      return DEFAULT_API_BASE_URL;
    }
    let url = String(raw).trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    return url;
  }

  function resolveApiBase() {
    try {
      const stored = localStorage.getItem(API_BASE_STORAGE_KEY);
      if (stored) {
        return normalizeApiBaseUrl(stored);
      }
    } catch (_) {
      /* ignore */
    }
    const { origin, hostname, port } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return origin;
    }
    if (port === "8000" || port === "8080") {
      return origin;
    }
    return DEFAULT_API_BASE_URL;
  }

  const API_BASE = resolveApiBase();

  if (siteRef) {
    window.__landingSite = { unesco_id: siteRef, id: siteRef };
  }

  const SECTION_SPLIT =
    /(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements))/gi;

  const SECTION_HEADER =
    /^(Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*/i;

  /** Google Translate hanterar ~5000 tecken – dela större UNESCO-block innan API-anrop. */
  const MAX_TRANSLATE_CHUNK = 4500;
  const MAX_BLOCK_CHARS = 5500;

  function toast(message) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2400);
  }

  function unescoImageUrl(unescoId) {
    if (!unescoId) return "";
    return `https://whc.unesco.org/uploads/sites/site_${unescoId}.jpg`;
  }

  function getUnescoDescription(site, language) {
    const key = `desc_${normalizeLanguageCode(language)}`;
    return String(site?.[key] || "").trim();
  }

  function englishDescriptionForSite(site) {
    return (
      (site?.description_en || "").trim() ||
      getUnescoDescription(site, "en") ||
      (site?.description || "").trim()
    );
  }

  function hasLongUnescoText(site) {
    return Boolean(
      site?.has_long_description ||
        (site?.description_en || "").trim() ||
        (site?.justification_en || "").trim()
    );
  }

  /** Ta bort UNESCO-rubriker ur löptext – stycken behålls, rubriker visas inte */
  function stripUnescoHeaders(text) {
    return String(text || "")
      .replace(SECTION_HEADER, "")
      .replace(
        /\b(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*/gi,
        " "
      )
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  /** Delar i stycken vid UNESCO-avsnitt (semantiskt) utan att visa rubriker */
  function splitIntoSemanticBlocks(text) {
    const raw = String(text || "").trim();
    if (!raw) return [];

    if (!SECTION_SPLIT.test(raw)) {
      SECTION_SPLIT.lastIndex = 0;
      return [raw];
    }
    SECTION_SPLIT.lastIndex = 0;

    return raw
      .split(SECTION_SPLIT)
      .map(part => stripUnescoHeaders(part))
      .filter(part => part.length > 20);
  }

  function splitOversizedBlocks(blocks) {
    const result = [];
    for (const block of blocks) {
      const text = String(block || "").trim();
      if (!text) continue;
      if (text.length <= MAX_BLOCK_CHARS) {
        result.push(text);
        continue;
      }
      const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
      let chunk = "";
      for (const sentence of sentences) {
        if ((chunk + sentence).length > MAX_BLOCK_CHARS && chunk) {
          result.push(chunk.trim());
          chunk = sentence;
        } else {
          chunk += sentence;
        }
      }
      if (chunk.trim()) {
        result.push(chunk.trim());
      }
    }
    return result;
  }

  function collectLandingContentBlocks(site) {
    const descEn = englishDescriptionForSite(site);
    const justEn = (site?.justification_en || "").trim();
    const blocks = [];
    if (descEn) {
      blocks.push(descEn);
    }
    if (justEn) {
      blocks.push(...splitIntoSemanticBlocks(justEn));
    }
    return splitOversizedBlocks(blocks);
  }

  function splitIntoParagraphs(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];

    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
    if (!sentences || sentences.length <= 3) {
      return [trimmed];
    }

    const paragraphs = [];
    let bucket = "";
    sentences.forEach((sentence, index) => {
      const piece = sentence.trim();
      if (!piece) return;
      bucket = bucket ? `${bucket} ${piece}` : piece;
      if ((index + 1) % 4 === 0 || index === sentences.length - 1) {
        paragraphs.push(bucket);
        bucket = "";
      }
    });
    if (bucket) {
      paragraphs.push(bucket);
    }
    return paragraphs.filter(p => p.length > 20);
  }

  async function translateViaApi(text, targetLang, sourceLang = "en", { retries = 1 } = {}) {
    const target = normalizeLanguageCode(targetLang);
    const source = normalizeLanguageCode(sourceLang);

    if (!text?.trim() || target === source) {
      return text || "";
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetch(`${API_BASE}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source_language: source,
            target_language: target,
          }),
        });
        const data = await response.json();
        if (response.ok && data?.translated_text?.trim()) {
          return data.translated_text.trim();
        }
      } catch (_) {
        /* retry */
      }
    }

    return text;
  }

  async function translateBody(text, targetLang) {
    const trimmed = stripUnescoHeaders(text);
    if (!trimmed) return "";

    const target = normalizeLanguageCode(targetLang);
    if (target === "en") {
      return trimmed;
    }

    if (trimmed.length <= MAX_TRANSLATE_CHUNK) {
      return translateViaApi(trimmed, target, "en");
    }

    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [trimmed];
    const chunks = [];
    let chunk = "";
    for (const sentence of sentences) {
      if ((chunk + sentence).length > MAX_TRANSLATE_CHUNK && chunk) {
        chunks.push(chunk.trim());
        chunk = sentence;
      } else {
        chunk += sentence;
      }
    }
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }

    const translated = [];
    for (const piece of chunks) {
      translated.push(await translateViaApi(piece, target, "en"));
    }
    return translated.filter(Boolean).join(" ");
  }

  function clearDescriptionContainer(container) {
    if (!container) return;
    container.classList.remove("landing-desc-loading");
    container.replaceChildren();
  }

  function ensureDescriptionLoader(container) {
    let loader = container.querySelector(".landing-desc-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "landing-desc-loader translation-loader";
      loader.setAttribute("aria-live", "polite");

      const spinner = document.createElement("span");
      spinner.className = "translation-spinner";
      spinner.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "landing-desc-loader-text";

      loader.appendChild(spinner);
      loader.appendChild(text);
      container.prepend(loader);
    }
    return loader.querySelector(".landing-desc-loader-text");
  }

  function setDescriptionLoadingProgress(container, current, total) {
    if (!container) return;
    const statusText = ensureDescriptionLoader(container);
    container.classList.add("landing-desc-loading");
    if (!total || total <= 1) {
      statusText.textContent = landingT("LOADING_UNESCO");
      return;
    }
    statusText.textContent = landingT("LOADING_UNESCO_PROGRESS", {
      current: String(current),
      total: String(total),
    });
  }

  function clearDescriptionStatus(container) {
    container?.querySelector(".landing-desc-loader")?.remove();
    container?.classList.remove("landing-desc-loading");
  }

  function appendParagraphs(parent, className, text, { blockIndex = null } = {}) {
    const paragraphs = splitIntoParagraphs(text);
    paragraphs.forEach((paragraph, paragraphIndex) => {
      const p = document.createElement("p");
      p.className = className;
      if (blockIndex !== null) {
        p.dataset.blockIndex = String(blockIndex);
        if (paragraphIndex === 0 && blockIndex > 0) {
          p.classList.add("landing-desc-block-first");
        }
      }
      p.textContent = paragraph;
      parent.appendChild(p);
    });
  }

  function replaceBlockParagraphs(container, blockIndex, text, className) {
    container
      .querySelectorAll(`p[data-block-index="${blockIndex}"]`)
      .forEach(node => node.remove());
    appendParagraphs(container, className, text, { blockIndex });
  }

  async function renderLongDescription(site, targetLang) {
    const container = document.getElementById("landingDescription");
    if (!container) return;

    const target = normalizeLanguageCode(targetLang);
    const blocks = collectLandingContentBlocks(site);

    clearDescriptionContainer(container);

    if (!blocks.length) {
      const fallback = getUnescoDescription(site, target) || landingT("NO_DESCRIPTION");
      appendParagraphs(container, "landing-desc-para", fallback);
      return;
    }

    blocks.forEach((block, index) => {
      appendParagraphs(container, "landing-desc-para", block, { blockIndex: index });
    });

    if (target === "en") {
      clearDescriptionStatus(container);
      return;
    }

    const total = blocks.length;
    for (let index = 0; index < total; index += 1) {
      setDescriptionLoadingProgress(container, index + 1, total);
      try {
        const translated = await translateBody(blocks[index], target);
        replaceBlockParagraphs(
          container,
          index,
          translated || blocks[index],
          "landing-desc-para"
        );
      } catch (_) {
        /* Behåll engelska stycken för detta avsnitt */
      }
    }

    clearDescriptionStatus(container);
  }

  function parseSiteId(site) {
    const raw = String(site?.unesco_id || site?.id || siteRef || "").trim();
    const numeric = Number.parseInt(raw, 10);
    return Number.isFinite(numeric) ? numeric : raw;
  }

  function formatApiError(data, fallback) {
    if (!data?.detail) return fallback;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map(entry => entry?.msg || entry?.message || "")
        .filter(Boolean)
        .join(" ");
    }
    return fallback;
  }

  function showPageContent() {
    const loading = document.getElementById("landingLoading");
    const content = document.getElementById("landingContent");
    const error = document.getElementById("landingError");
    if (loading) loading.style.display = "none";
    if (error) error.style.display = "none";
    if (content) content.style.display = "block";
  }

  function setAiAnswer(text, { loading = false } = {}) {
    const answerBox = document.getElementById("landingAiAnswer");
    if (!answerBox) return;
    answerBox.textContent = text;
    answerBox.classList.toggle("is-active", Boolean(text) || loading);
    if (text && !loading) {
      answerBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  async function renderSite(site) {
    applyLandingUiLanguage(lang);
    document.title = `${site.name} - Heritage Connect`;
    const img = document.getElementById("landingImage");
    const title = document.getElementById("landingTitle");
    const meta = document.getElementById("landingMeta");
    const profileLink = document.getElementById("landingProfileLink");
    const uid = String(site.unesco_id || site.id || siteRef);

    window.__landingSite = { ...site, unesco_id: uid };
    showPageContent();

    if (title) title.textContent = site.name || landingT("WORLD_HERITAGE");
    if (meta) {
      const parts = [site.country, site.category, site.year_inscribed].filter(Boolean);
      meta.textContent = parts.join(" · ");
    }

    if (img) {
      img.src = site.image_url || unescoImageUrl(uid);
      img.alt = site.name || landingT("WORLD_HERITAGE");
      img.onerror = () => {
        img.style.display = "none";
      };
    }
    if (profileLink) {
      const profileParams = new URLSearchParams({
        site: uid,
        step: "confirmation",
      });
      if (lang) {
        profileParams.set("lang", lang);
      }
      profileLink.href = `/demo?${profileParams.toString()}`;
    }

    const descContainer = document.getElementById("landingDescription");
    if (hasLongUnescoText(site)) {
      if (descContainer) {
        clearDescriptionContainer(descContainer);
        if (normalizeLanguageCode(lang) !== "en") {
          setDescriptionLoadingProgress(descContainer, 0, 1);
        }
      }
      renderLongDescription(site, lang).catch(() => {
        if (!descContainer) return;
        if (!descContainer.querySelector(".landing-desc-para")) {
          clearDescriptionContainer(descContainer);
          appendParagraphs(
            descContainer,
            "landing-desc-para",
            landingT("UNESCO_LOAD_ERROR")
          );
        }
        clearDescriptionStatus(descContainer);
      });
    } else if (descContainer) {
      clearDescriptionContainer(descContainer);
      const localized = getUnescoDescription(site, lang) || site.description || "";
      appendParagraphs(
        descContainer,
        "landing-desc-para",
        localized || landingT("NO_DESCRIPTION")
      );
    }
  }

  function showError() {
    const loading = document.getElementById("landingLoading");
    const content = document.getElementById("landingContent");
    const error = document.getElementById("landingError");
    if (loading) loading.style.display = "none";
    if (content) content.style.display = "none";
    if (error) error.style.display = "block";
  }

  async function loadFromLocalJson() {
    const response = await fetch("/data/heritage-sites.json");
    if (!response.ok) throw new Error("json_unavailable");
    const sites = await response.json();
    const site = sites.find(
      item => String(item.unesco_id) === siteRef || String(item.id) === siteRef
    );
    if (!site) throw new Error("not_found");
    return site;
  }

  async function enrichSiteFromApi(site) {
    const uid = String(site.unesco_id || site.id || siteRef);
    try {
      const response = await fetch(
        `${API_BASE}/api/sites/public/${encodeURIComponent(uid)}?lang=${lang}`
      );
      if (response.ok) {
        return response.json();
      }
    } catch (_) {
      /* use partial site */
    }
    return site;
  }

  async function loadSite() {
    if (!siteRef) {
      showError();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/sites/public/${encodeURIComponent(siteRef)}?lang=${lang}`
      );
      if (response.ok) {
        await renderSite(await response.json());
        return;
      }
    } catch (_) {
      /* fall back */
    }

    try {
      const site = await loadFromLocalJson();
      await renderSite(await enrichSiteFromApi(site));
    } catch (_) {
      showError();
    }
  }

  async function askAi() {
    const input = document.getElementById("landingAiInput");
    const askBtn = document.getElementById("landingAiBtn");
    const site = window.__landingSite;
    const question = input ? input.value.trim() : "";

    if (!question) {
      toast(landingT("ASK_FIRST"));
      return;
    }

    const siteId = parseSiteId(site);
    if (!siteId) {
      toast(landingT("SITE_STILL_LOADING"));
      return;
    }

    setAiAnswer(landingT("AI_SEARCHING"), { loading: true });
    if (askBtn) askBtn.disabled = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          question,
          language: lang,
        }),
        signal: controller.signal,
      });
      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }
      if (!response.ok) {
        throw new Error(formatApiError(data, `AI-fel (${response.status})`));
      }
      setAiAnswer(data.answer || landingT("NO_AI_ANSWER"));
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      const isNetwork =
        error?.message === "Failed to fetch" || error?.name === "TypeError";
      let message = error?.message || "okänt fel";
      if (isAbort) {
        message = landingT("AI_TIMEOUT");
      } else if (isNetwork) {
        message = landingT("AI_NETWORK_ERROR", { base: API_BASE });
      }
      setAiAnswer(`${landingT("AI_ERROR_PREFIX")} ${message}`);
    } finally {
      clearTimeout(timeoutId);
      if (askBtn) askBtn.disabled = false;
    }
  }

  document.getElementById("landingAiBtn")?.addEventListener("click", askAi);
  document.getElementById("landingAiInput")?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      askAi();
    }
  });
  loadSite();
})();
