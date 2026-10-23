async function UserCreateAPI(UserData) 
const response = await fetch(API_URL,{
    body: JSON.stringify(UserData),  
})

const data = await response.json();
if (!response.ok){
    throw new Error(data.detail ll "failed to create user");
    return data;

}
