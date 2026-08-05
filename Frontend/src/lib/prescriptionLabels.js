// HerbalMedicineForm stores dosage/frequency/route as fixed English defaults
// ("As prescribed", "As directed", "oral") rather than translation keys, so
// display sites need to map the known values through i18n themselves —
// unrecognized values (older data, or a future free-text entry point) fall
// back to the raw stored string rather than showing nothing.
const DOSAGE_KEYS = { "As prescribed": "prescription.dosage.asPrescribed" };
const FREQUENCY_KEYS = { "As directed": "prescription.frequency.asDirected" };
const ROUTE_KEYS = { oral: "prescription.route.oral" };

const translateField = (t, map, value) => {
  const key = map[value];
  return key ? t(key) : value;
};

export const translateDosage = (t, value) => translateField(t, DOSAGE_KEYS, value);
export const translateFrequency = (t, value) => translateField(t, FREQUENCY_KEYS, value);
export const translateRoute = (t, value) => translateField(t, ROUTE_KEYS, value);
