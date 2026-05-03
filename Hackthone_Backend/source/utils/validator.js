const validator = require("validator");

const normalizeField = (value) => (typeof value === "string" ? value.trim() : "");

const validate= (data)=>{

    if(!data || typeof data !== "object")
    {
        throw new Error("invalid request body");
    }

    const mandatoryField = ["firstName", "email", "password"];

    const IsAllowed = mandatoryField.every((k)=>Object.keys(data).includes(k) );

    if(!IsAllowed)
    {
        throw new Error("fileds are missing ");
    }

    const firstName = normalizeField(data.firstName);
    const email = normalizeField(data.email).toLowerCase();
    const password = normalizeField(data.password);

    if(!firstName || !email || !password)
    {
        throw new Error("firstName, email, and password are required.");
    }

    data.firstName = firstName;
    data.email = email;
    data.password = password;

    if (typeof data.lastName === "string") {
        data.lastName = data.lastName.trim();
    }

    if(!validator.isEmail(email))
    {
        throw new Error("invalid email ");
    }

    if(!validator.isStrongPassword(password))
    {
        throw new Error("week password ");
    }

}

module.exports = validate;
