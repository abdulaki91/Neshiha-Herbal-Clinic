# Test API Endpoints

## Test Waiting Patients

Open your browser console (F12) on http://localhost:5174 and run:

```javascript
// Test 1: Get all waiting visits
fetch("http://localhost:5000/api/v1/visits?status=waiting", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("accessToken"),
  },
})
  .then((res) => res.json())
  .then((data) => console.log("Waiting visits:", data))
  .catch((err) => console.error("Error:", err));

// Test 2: Get today's date visits
const today = new Date().toISOString().split("T")[0];
fetch(`http://localhost:5000/api/v1/visits?visitDate=${today}&status=waiting`, {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("accessToken"),
  },
})
  .then((res) => res.json())
  .then((data) => console.log("Today waiting visits:", data))
  .catch((err) => console.error("Error:", err));
```

## Expected Response

Should return:

```json
{
  "visits": [
    {
      "id": "...",
      "visitNumber": "V-20260616-...",
      "status": "waiting",
      "patient": {
        "id": "...",
        "patientId": "P-...",
        "firstName": "Abebe",
        "lastName": "Tesfaye",
        "age": 44,
        "gender": "male",
        ...
      }
    }
  ],
  "pagination": {...}
}
```

## If No Results

Run the test data script:

```bash
cd Backend
npm run test-data
```
