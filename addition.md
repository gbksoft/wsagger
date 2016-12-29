### Мова опису сценаріїв

Схема синтаксису (JSON schema) живе в файлі schema/wsagger.schema.json

Запуск валідатора для файлу зі сценарієм: ./v <filename>. Наприклад:

./v chat.sc/delete_group_message.wsagger.json   


###

Запуск на виконання всіх сценаріїв з деякого каталогу : ./ra <dirname> <server> <user>. Наприклад:

    ./ra chat.sc dev 2

    > ...   
    > numSuccess: 14   
    > numFail: 3   
