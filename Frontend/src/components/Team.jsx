import { useTranslation } from "react-i18next";
import { usePublicTeamMembers } from "../hooks/usePublicContent";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const SOCIAL_ICONS = { linkedin: "💼", twitter: "✖️", facebook: "📘" };

export default function Team() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: members = [], isLoading } = usePublicTeamMembers();

  if (!isLoading && members.length === 0) return null;

  return (
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {t("team.title", "Meet Our Team")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("team.subtitle", "Certified practitioners dedicated to your wellness")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {members.map((member) => (
              <div
                key={member.id}
                className="text-center bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-emerald-100 p-6"
              >
                {member.photo ? (
                  <img
                    src={`${backendBase}/${member.photo}`}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-emerald-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
                    {member.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <h3 className="font-bold text-gray-800">{member.name}</h3>
                <p className="text-sm text-emerald-600 mb-3">
                  {member.role?.[locale] || member.role?.en}
                </p>
                {member.bio?.[locale] || member.bio?.en ? (
                  <p className="text-xs text-gray-500 line-clamp-3 mb-3">
                    {member.bio?.[locale] || member.bio?.en}
                  </p>
                ) : null}
                {Object.entries(SOCIAL_ICONS).some(([key]) => member.socialLinks?.[key]) && (
                  <div className="flex justify-center gap-2">
                    {Object.entries(SOCIAL_ICONS)
                      .filter(([key]) => member.socialLinks?.[key])
                      .map(([key, emoji]) => (
                        <a
                          key={key}
                          href={member.socialLinks[key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 rounded-full flex items-center justify-center text-sm transition-colors"
                        >
                          {emoji}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
