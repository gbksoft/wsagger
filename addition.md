### Мова опису сценаріїв

Схема синтаксису (JSON schema) живе в файлі schema/wsagger.schema.json

Запуск валідатора для файлу зі сценарієм: ./v <filename>. Наприклад:

./v chat.sc/delete_group_message.wsagger.json   

Поля файла сценаріїв:
 
    REST_     // варінти REST-сервера для конектів
    server_   // варінти сокет-сервера для конектів
    user_     // варінти користувачів для конектів
    name
    parameters
    data      // список кроків


Один крок сценарію — це обʼєкт з полями:

    action       // варіянти: "connect", "request" (відправка в сокет) або "apply" (виклик функції)
    data         // список параметрів для action-виклику
    wait.delay   // очікування після виконання кроку
    expected     // список обʼєктів, які поивнні прийти у сокет

В полях data і expected допустимо використовувати шаблони:

    {{key}}     // підставновка значення з parameters[key]

В полях waitForResponse.data також допустимо використовувати шаблони:
    
    {{!key}}    // присвоєння в parameters[key] значення з відповідного елементу waitForResponse.data




### Консольні виклики

Запуск сценарію на виконання: ./r <filename> <server> <user>. Наприклад:

    ./r chat.sc/connect_with_token.wsagger.json dev 2   
    // успіх 
    
    ./r chat.sc/delete_group_message.wsagger.json dev 2 
    // помилка (дебаг-інфу треба вивести якось краще)

Параметри <server> і <user> — це ключі з відповідних обʼєктів server_ і user_ у файлі сценарію.

Запуск на виконання всіх сценаріїв з деякого каталогу : ./ra <dirname> <server> <user>. Наприклад:

    ./ra chat.sc dev 2

    > ...   
    > numSuccess: 14   
    > numFail: 3   
