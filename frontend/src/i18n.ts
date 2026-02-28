import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    it: {
        translation: {
            "dashboard_title": "Dashboard",
            "my_schedule": "Il mio Planning",
            "team": "Squadra",
            "office_map": "Mappa Ufficio",
            "analytics": "Statistiche",
            "good_morning": "Buongiorno",
            "beautiful_day_m": "È un bellissimo {{day}}. Pronto a collaborare?",
            "beautiful_day_f": "È una bellissima {{day}}. Pronto a collaborare?",
            "where_are_you": "Dove sei oggi?",
            "at_office": "In Ufficio",
            "collaborating_in_person": "Collaboro in presenza",
            "remote": "Da Remoto",
            "focus_time": "Tempo di focus da casa",
            "office_days": "Giorni in Ufficio",
            "remote_days": "Giorni da Remoto",
            "team_presence": "Presenza Team",
            "weekly_plan": "Piano Settimanale",
            "edit_schedule": "Modifica Piano",
            "mon": "Lun",
            "tue": "Mar",
            "wed": "Mer",
            "thu": "Gio",
            "fri": "Ven",
            "whos_in": "Chi c'è oggi?",
            "find_teammate": "Cerca collega...",
            "all": "Tutti",
            "office": "Ufficio",
            "happening_now": "In programmazione",
            "team_lunch": "Pranzo di Squadra",
            "main_lobby": "Atrio Principale"
        }
    },
    en: {
        translation: {
            "dashboard_title": "Dashboard",
            "my_schedule": "My Schedule",
            "team": "Team",
            "office_map": "Office Map",
            "analytics": "Analytics",
            "good_morning": "Good Morning",
            "beautiful_day_m": "It's a beautiful {{day}}. Ready to collaborate?",
            "beautiful_day_f": "It's a beautiful {{day}}. Ready to collaborate?",
            "where_are_you": "Where are you today?",
            "at_office": "At the Office",
            "collaborating_in_person": "Collaborating in person",
            "remote": "Working Remotely",
            "focus_time": "Focus time from home",
            "office_days": "Office Days",
            "remote_days": "Remote Days",
            "team_presence": "Team Presence",
            "weekly_plan": "Weekly Plan",
            "edit_schedule": "Edit Schedule",
            "mon": "Mon",
            "tue": "Tue",
            "wed": "Wed",
            "thu": "Thu",
            "fri": "Fri",
            "whos_in": "Who's in Today?",
            "find_teammate": "Find a teammate...",
            "all": "All",
            "office": "Office",
            "happening_now": "Happening Now",
            "team_lunch": "Team Lunch",
            "main_lobby": "Main Lobby"
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
