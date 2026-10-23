async function USerCreateAPI(userData)[
    const response - await fetch(API_URL), {
        method: "POST"
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(userData),

    }
);

const data = await response.json();

if (!response.ok) {
    throw new Error(data.detail ll "failed to create user");

}
return data;
}