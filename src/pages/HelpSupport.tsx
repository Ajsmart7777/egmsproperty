export default function HelpSupport() {
  const articles = [
    {
      title: "What qualifies as emergency maintenance?",
      body: "Emergency maintenance includes flooding, electrical sparks, broken locks affecting security, gas or fire risk, and major plumbing leaks that need immediate attention.",
    },
    {
      title: "How to submit a maintenance request",
      body: "Go to your dashboard and click on Submit Maintenance Request. Fill in the issue details clearly, add your apartment or unit, and upload a photo if needed.",
    },
    {
      title: "My AC is not cooling properly",
      body: "Check that the power supply is stable and confirm the unit is switched on properly. If the issue continues, submit a maintenance request with a short description.",
    },
    {
      title: "What should I do if water is leaking?",
      body: "If the leakage is minor, place a container under the source and submit a normal request. If the leakage is heavy or spreading, use the Emergency Maintenance option immediately.",
    },
    {
      title: "When should I contact management directly?",
      body: "Contact management directly for urgent safety-related issues, access problems, or if a technician has not arrived after an approved emergency request.",
    },
    {
      title: "How do I track my request?",
      body: "Open View My Requests on your dashboard to see the current status of your request, including pending, in progress, or completed updates.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8f7] p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#94b83d] mb-2">Help Center</p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1f2937]">
            Tenant Help & Support
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Find quick answers to common maintenance questions and learn when to
            submit a normal request or use emergency maintenance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {articles.map((article, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-[#1f2937] mb-3">
                {article.title}
              </h3>
              <p className="text-gray-600 leading-7 text-sm">{article.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}