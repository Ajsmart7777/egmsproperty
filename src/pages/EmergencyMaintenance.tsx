import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const EmergencyMaintenance = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground mb-4"
        >
          ← Back
        </button>

        <div className="bg-card rounded-2xl p-6 shadow-card">

          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" />
            <h1 className="text-xl font-bold">
              Emergency Maintenance Request
            </h1>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Use this form only for urgent issues such as flooding, electrical hazards,
            security problems, or severe plumbing leaks.
          </p>

          <form className="space-y-4">

            <input
              type="text"
              placeholder="Apartment / Unit"
              className="w-full border rounded-lg p-3"
            />

            <select className="w-full border rounded-lg p-3">
              <option>Select Emergency Type</option>
              <option>Water Leak</option>
              <option>Electrical Problem</option>
              <option>Security Issue</option>
              <option>Broken Door / Lock</option>
              <option>Fire Risk</option>
            </select>

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border rounded-lg p-3"
            />

            <textarea
              placeholder="Describe the emergency problem"
              rows={4}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="file"
              className="w-full border rounded-lg p-3"
            />

            <button
              type="submit"
              className="w-full bg-red-600 text-white rounded-lg p-3 font-semibold"
            >
              Submit Emergency Request
            </button>

          </form>

        </div>
      </div>
    </div>
  );
};

export default EmergencyMaintenance;