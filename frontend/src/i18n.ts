import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    it: {
        translation: {
            // ── Sidebar / Navigation ──
            "dashboard_title": "Dashboard",
            "my_schedule": "Il mio Planning",
            "team": "Squadra",
            "office_map": "Mappa Ufficio",
            "analytics": "Statistiche",
            "profile": "Profilo",
            "logout": "Esci",

            // ── Office Map Page ──
            "office_map_subtitle": "Trova la strada per la nostra sede principale",
            "search_nearby_landmarks": "Cerca punti di interesse vicini...",
            "main_headquarters": "Sede Principale",
            "get_directions": "Ottieni Indicazioni",

            // ── Dashboard: Greeting ──
            "good_morning": "Buongiorno",
            "beautiful_day_m": "È un bellissimo {{day}}. Pronto a collaborare?",
            "beautiful_day_f": "È una bellissima {{day}}. Pronto a collaborare?",
            "sunny_vibes": "Buone Vibrazioni in Ufficio",

            // ── Dashboard: Status ──
            "where_are_you": "Dove sei oggi?",
            "confirm": "Conferma",
            "at_office": "In Ufficio",
            "collaborating_in_person": "Collaboro in presenza",
            "remote": "Da Remoto",
            "focus_time": "Tempo di focus da casa",
            "sick": "Malattia",
            "holiday": "Ferie",

            // ── Dashboard: Stats ──
            "office_days": "Giorni in Ufficio",
            "remote_days": "Giorni da Remoto",
            "team_presence": "Presenza Team",
            "weekly_plan": "Il tuo piano settimanale",
            "monthly_plan": "Piano Mensile",
            "planned_days": "Giorni pianificati",
            "of_working_days": "su {{total}} giorni lavorativi",
            "edit_schedule": "Modifica Piano",
            "to_plan": "Da pianificare",
            "holidays_leaves": "Ferie / Permessi",

            // ── Dashboard: Days ──
            "mon": "Lun",
            "tue": "Mar",
            "wed": "Mer",
            "thu": "Gio",
            "fri": "Ven",

            // ── Dashboard: Right sidebar ──
            "whos_in": "Chi c'è oggi?",
            "find_teammate": "Cerca collega...",
            "office": "Ufficio",
            "no_colleagues_yet": "Nessun collega qui...",
            "in_office_status": "In Ufficio",
            "remote_status": "Da Remoto",
            "unavailable": "Non Disponibile",


            // ── Common ──
            "save": "Salva",
            "cancel": "Annulla",
            "today": "Oggi",
            "no_history": "Nessuna cronologia disponibile",
            "all": "Tutti",
            "in_office": "In Ufficio",
            "absent": "Assenti",
            "totals": "Totali",

            // ── Team Page ──
            "team_overview": "Panoramica Team",
            "manage_team": "Gestisci la posizione e la disponibilità del tuo team.",
            "today_presence_summary": "Riepilogo Presenze Oggi",
            "presence_summary_for": "Riepilogo presenze del {{date}}",
            "search_colleagues": "Cerca colleghi...",
            "no_colleague_found": "Nessun collega trovato",
            "try_change_filters": "Prova a cambiare i filtri di ricerca",
            "today_presence": "Presenza Oggi",
            "remote_label": "Remoto",
            "previous_day": "Giorno precedente",
            "next_day": "Giorno successivo",

            // ── Profile Page ──
            "personal_information": "Informazioni Personali",
            "save_changes": "Salva Modifiche",
            "saving": "Salvataggio...",
            "saved": "Salvato!",
            "email_address": "Indirizzo Email",
            "phone_number": "Numero di Telefono",
            "department": "Dipartimento",
            "office_location": "Sede di Lavoro",
            "work_statistics": "Statistiche Lavoro",
            "remote_work": "Lavoro da Remoto",
            "settings": "Impostazioni",
            "email_notifications": "Notifiche Email",
            "email_notifications_desc": "Ricevi un riepilogo giornaliero degli aggiornamenti.",
            "profile_visibility": "Visibilità del Profilo",
            "profile_visibility_desc": "Permetti ai colleghi di vedere le tue statistiche.",
            "my_achievements": "I Miei Traguardi",
            "remote_champion": "Campione del Remoto",
            "days_working_remotely": "{{count}} giorni in remoto",
            "office_regular": "Habitué dell'Ufficio",
            "days_in_office": "{{count}} giorni in ufficio",
            "always_updated": "Sempre Aggiornato",
            "logged_days": "{{count}} giorni registrati",
            "coffee_lover": "Amante del Caffè",
            "coming_soon": "Prossimamente",
            "change_avatar": "Cambia Immagine Profilo",
            "drag_and_drop": "Trascina qui l'immagine",
            "or_click_to_browse": "oppure clicca per cercare",
            "max_size": "Max 4MB (JPG, PNG)",
            "remove": "Rimuovi",
            "uploading": "Caricamento...",
            "save_avatar": "Salva Avatar",

            // Profile: Errors
            "error_must_be_image": "Il file deve essere un'immagine.",
            "error_file_too_large": "L'immagine è troppo grande. Il limite massimo è 4MB.",
            "error_bad_request": "Il formato del file non è corretto o l'immagine è corrotta.",
            "error_unauthorized": "Sessione scaduta o non sei autorizzato. Prova ad effettuare nuovamente il login.",
            "error_server": "Si è verificato un errore sul server. Riprova più tardi.",
            "error_connection": "Errore di connessione. Verifica di essere connesso a internet e riprova.",
            "upload_failed_generic": "Caricamento fallito. Impossibile aggiornare l'avatar.",

            // ── Planning Page ──
            "where_create_magic": "Dove creerai la magia questo mese?",
            "hello": "Ciao",
            "plan_your_month": "Pianifica il tuo mese qui sotto.",
            "monthly_pulse": "Riepilogo Mensile",
            "in_office_label": "In Ufficio",
            "remote_single": "Remoto",
            "sick_label": "Malattia",
            "holiday_label": "Ferie",
            "remove_status": "Rimuovi",
            "back_to_overview": "Torna alla panoramica",
            "weekend_disabled": "Modifica non abilitata per i weekend",
            "cannot_edit_past": "Non puoi modificare i giorni passati",

            // ── Login Page ──
            "workspace_freedom": "Libertà di Lavoro",
            "workspace_freedom_desc": "Monitora la tua posizione e connettiti col team, ovunque tu sia.",
            "welcome_back": "Bentornato!",
            "enter_details": "Inserisci le tue credenziali per accedere.",
            "password": "Password",
            "remember_me": "Ricordami",
            "forgot_password": "Password dimenticata?",
            "signing_in": "Accesso in corso...",
            "sign_in": "Accedi",
            "or_continue_with": "Oppure continua con",
            "sso": "Single Sign-On (SSO)",
            "no_account": "Non hai un account?",
            "contact_hr": "Contatta HR",
            "privacy": "Privacy",
            "terms": "Termini",
            "help": "Aiuto",
            "login_error_unexpected": "Si è verificato un errore imprevisto durante l'accesso."
        }
    },
    en: {
        translation: {
            // ── Sidebar / Navigation ──
            "dashboard_title": "Dashboard",
            "my_schedule": "My Schedule",
            "team": "Team",
            "office_map": "Office Map",
            "analytics": "Analytics",
            "profile": "Profile",
            "logout": "Logout",

            // ── Office Map Page ──
            "office_map_subtitle": "Find your way to our main headquarters",
            "search_nearby_landmarks": "Search nearby landmarks...",
            "main_headquarters": "Main Headquarters",
            "get_directions": "Get Directions",

            // ── Dashboard: Greeting ──
            "good_morning": "Good Morning",
            "beautiful_day_m": "It's a beautiful {{day}}. Ready to collaborate?",
            "beautiful_day_f": "It's a beautiful {{day}}. Ready to collaborate?",
            "sunny_vibes": "Sunny Office Vibes",

            // ── Dashboard: Status ──
            "where_are_you": "Where are you today?",
            "confirm": "Confirm",
            "at_office": "At the Office",
            "collaborating_in_person": "Collaborating in person",
            "remote": "Remote",
            "focus_time": "Focus time from home",
            "sick": "Sick",
            "holiday": "Holiday",

            // ── Dashboard: Stats ──
            "office_days": "Office Days",
            "remote_days": "Remote Days",
            "team_presence": "Team Presence",
            "weekly_plan": "Your weekly plan",
            "monthly_plan": "Monthly Plan",
            "planned_days": "Planned days",
            "of_working_days": "out of {{total}} working days",
            "edit_schedule": "Edit Schedule",
            "to_plan": "To plan",
            "holidays_leaves": "Holidays / Leaves",

            // ── Dashboard: Days ──
            "mon": "Mon",
            "tue": "Tue",
            "wed": "Wed",
            "thu": "Thu",
            "fri": "Fri",

            // ── Dashboard: Right sidebar ──
            "whos_in": "Who's in Today?",
            "find_teammate": "Find a teammate...",
            "office": "Office",
            "no_colleagues_yet": "No colleagues here yet...",
            "in_office_status": "In Office",
            "remote_status": "Remote",
            "unavailable": "Unavailable",


            // ── Common ──
            "save": "Save",
            "cancel": "Cancel",
            "today": "Today",
            "no_history": "No history available",
            "all": "All",
            "in_office": "In Office",
            "absent": "On Leave",
            "totals": "Total",

            // ── Team Page ──
            "team_overview": "Team Overview",
            "manage_team": "Manage your team's location and availability.",
            "today_presence_summary": "Today's Presence Summary",
            "presence_summary_for": "Presence Summary for {{date}}",
            "search_colleagues": "Search colleagues...",
            "no_colleague_found": "No colleague found",
            "try_change_filters": "Try changing the search filters",
            "today_presence": "Today's Presence",
            "remote_label": "Remote",
            "previous_day": "Previous day",
            "next_day": "Next day",

            // ── Profile Page ──
            "personal_information": "Personal Information",
            "save_changes": "Save Changes",
            "saving": "Saving...",
            "saved": "Saved!",
            "email_address": "Email Address",
            "phone_number": "Phone Number",
            "department": "Department",
            "office_location": "Office Location",
            "work_statistics": "Work Statistics",
            "remote_work": "Remote Work",
            "settings": "Settings",
            "email_notifications": "Email Notifications",
            "email_notifications_desc": "Receive daily digest of location updates.",
            "profile_visibility": "Profile Visibility",
            "profile_visibility_desc": "Allow colleagues to see your stats.",
            "my_achievements": "My Achievements",
            "remote_champion": "Remote Champion",
            "days_working_remotely": "{{count}} days working remotely",
            "office_regular": "Office Regular",
            "days_in_office": "{{count}} days in office",
            "always_updated": "Always Updated",
            "logged_days": "{{count}} logged days",
            "coffee_lover": "Coffee Lover",
            "coming_soon": "Coming soon",
            "change_avatar": "Change Profile Picture",
            "drag_and_drop": "Drag and drop your image here",
            "or_click_to_browse": "or click to browse",
            "max_size": "Max 4MB (JPG, PNG)",
            "remove": "Remove",
            "uploading": "Uploading...",
            "save_avatar": "Save Avatar",

            // Profile: Errors
            "error_must_be_image": "File must be an image.",
            "error_file_too_large": "The image is too large. Maximum allowed size is 4MB.",
            "error_bad_request": "The file format is incorrect or the image is corrupted.",
            "error_unauthorized": "Session expired or you are not authorized. Please log in again.",
            "error_server": "A server error occurred. Please try again later.",
            "error_connection": "Connection error. Check your internet and try again.",
            "upload_failed_generic": "Upload failed. Unable to update avatar.",

            // ── Planning Page ──
            "where_create_magic": "Where will you create magic this month?",
            "hello": "Hello",
            "plan_your_month": "Plan your month below.",
            "monthly_pulse": "Monthly Pulse",
            "in_office_label": "In Office",
            "remote_single": "Remote",
            "sick_label": "Sick",
            "holiday_label": "Holiday",
            "remove_status": "Remove",
            "back_to_overview": "Back to overview",
            "weekend_disabled": "Weekend editing disabled",
            "cannot_edit_past": "Cannot edit past days",

            // ── Login Page ──
            "workspace_freedom": "Workspace Freedom",
            "workspace_freedom_desc": "Seamlessly track your location and connect with your team, wherever you are.",
            "welcome_back": "Welcome back!",
            "enter_details": "Please enter your details to sign in.",
            "password": "Password",
            "remember_me": "Remember me",
            "forgot_password": "Forgot password?",
            "signing_in": "Signing in...",
            "sign_in": "Sign In",
            "or_continue_with": "Or continue with",
            "sso": "Single Sign-On (SSO)",
            "no_account": "Don't have an account?",
            "contact_hr": "Contact HR",
            "privacy": "Privacy",
            "terms": "Terms",
            "help": "Help",
            "login_error_unexpected": "An unexpected error occurred during login."
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'it', // Lingua di default
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
