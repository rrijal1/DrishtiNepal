// Client-safe constants and types
export type Locale = "en" | "np";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const translations = {
  en: {
    nav: {
      manifesto: "Manifesto",
      ministers: "Ministers",
      research: "Research",
      search: "Search",
    },
    home: {
      heroTitle: "Tracking Every Promise.",
      heroSubtitle: "Every Decision.",
      heroDescription:
        "Drishti Nepal monitors cabinet ministers 24/7 — matching their actions against their election manifestos so citizens can see who delivers and who doesn't.",
      viewMinisters: "View Ministers →",
      ministersTracked: "Ministers Tracked",
      postsPublished: "Posts Published",
      sourcesMonitored: "Sources Monitored",
    },
  },
  np: {
    nav: {
      manifesto: "वाचा पत्र",
      ministers: "मन्त्रीहरू",
      research: "अनुसन्धान",
      search: "खोज्नुहोस्",
    },
    home: {
      heroTitle: "हरेक वाचाको ट्र्याकिङ।",
      heroSubtitle: "हरेक निर्णयको लेखाजोखा।",
      heroDescription:
        "दृष्टि नेपालले क्याबिनेट मन्त्रीहरूलाई २४/७ निगरानी गर्दछ - उनीहरूको कार्यहरूलाई उनीहरूको चुनावी घोषणापत्रसँग मिलाउँछ ताकि नागरिकहरूले कसले डेलिभर गर्छ र कसले गर्दैन भनेर हेर्न सकून।",
      viewMinisters: "मन्त्रीहरू हेर्नुहोस् →",
      ministersTracked: "अनुगमन गरिएका मन्त्रीहरू",
      postsPublished: "प्रकाशित लेखहरू",
      sourcesMonitored: "अनुगमन गरिएका स्रोतहरू",
    },
  },
};
