# js-interview-assessment

## Project Overview:

Your task is to create a simple currency conversion tool similar to that which can be found on Google.

- Please complete this assignment using the front-end framework specified in the job description for the position you applied to.
- Please focus on component composition and adhering to best practices in coding first and foremost, and then the overall layout and design if time permits.
- We’d love for you to use this take-home project as an opportunity to showcase your skills and familiarity with the given framework. That said, we understand your time is valuable — please don’t feel the need to over-engineer or spend too many hours on it. We’re more interested in seeing your thought process, coding style, and how you approach problems.

## Requirements:

### Currency Selection:

1. Provide two select boxes for users to choose a currency to convert from and to.
1. Fetch a list of currencies from the https://api.currencybeacon.com/v1/currencies API.
1. Populate the select boxes with the available options returned from the API.

### Currency Conversion:

1. Allow users to input an amount for the “from” currency.
1. Fetch the converted value from the https://api.currencybeacon.com/v1/convert API.
1. Populate the “to” value based on the value returned from the API.

## API Overview:

- For this assessment, you will be required to make use of the following free API resource: [https://currencybeacon.com](https://currencybeacon.com/register)
- You will need to register for a free account to get access to your `API_KEY`.
  - Your `API_KEY` can be found on the main dashboard once you log in under `API Token Information`.
- Your application should make use of the following two API calls:
  - https://api.currencybeacon.com/v1/currencies
  - https://api.currencybeacon.com/v1/convert
- Full documentation can be found here: https://currencybeacon.com/api-documentation
- _Please ensure that you have carefully studied the API responses and selected the most appropriate nodes for the mapping of data._

## Submission Guidelines:

- Provide a link to your public repo for us to clone or email us a ZIP of the project.
- Include clear instructions on how to run your application locally.
- Document any assumptions or decisions you make during the development process.
- Submit your completed project within the specified timeframe.

## Evaluation Criteria:

### Functionality:

> Does the application meet the specified requirements? Does it accurately perform currency conversion?

### Code Quality:

> Is the code well-structured, readable, and maintainable? Are best practices followed?

### Component Composition:

> Are components appropriately structured and reused? Is there unnecessary duplication?

### User Experience:

> Is the user interface intuitive and easy to use? Does it provide clear feedback to users?

### Additional Features:

> Are any optional features implemented effectively?

## Notes:

- You are encouraged to use any additional libraries or tools you find necessary to complete the project efficiently.
- Please ensure that your project is self-contained and can be easily set up and run by the evaluation team.
- If you have any questions or need clarification on the requirements, feel free to reach out for assistance. Good luck!
