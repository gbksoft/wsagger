## WSagger — валідація

Схема живе в файлі wsagger.schema.json
Приклад для валідації живе в файлі wsagger.json

Запуск валідатора: ./node validate.js

В схемі є деякі "порожні поля" — parameter.data, parameter.dataType, flow.data, flow.dataType — тобто для них поки що дозволені які завгодно значення. Кінцева їх валідація, думаю, простіше зробиться в рантаймі (data згідно відповідного dataType). Але можна намагатись допиляти все це засобами "JSON Schema".    


## WSagger — інтерфейс


### Підготовка до роботи

Користувач може:

* вибрати файл опису інтерфейсу (який небудь wsagger.json) по URL або завантаженням з диска
* отримати токен для авторизації на WS-сервері - по REST API
     

### Файл опису інтерфейсу

Обʼєкт наступної структури (плюс-мінус крокодил):

    {
       "wsagger": "0.0.1",
       "info": {
          "description": "API for GBK chat",
          "version": "1.0.0",
          "title": "GBKSOFT chat API"
       },
       "scenarios": []
    }


### Сценарії

Сценарій (елемент списку "scenarios") — це масив наступної структури (для прикладу):
    [
       {
          "name": "connect to socket.io",
          "summary": " ",
          "parameters": [
             {             
                "in": "formData",
                "name": "namespace",
                "description": "connect to socket.io",
                "dataType": "string"
             }
          ],
          "operationId": "connect",
          "flow": [
             {
                "action": "connect", 
                "key": "socket.io", 
                "data": {"token": "@"},
                "dataType": "object"
             }
          ]
       },
       {
          "name": "sendBroadcastMessage",
          "summary": " ",
          "parameters": [
             { 
               "in": "formData",
               "name": "messageText",
               "description": "broadcast message text",
                "dataType": "string"
             }
          ],
          "condition": "connect",
          "operationId": "",
          "flow": [
             {
                "action": "request", 
                "key": "sendMessage", 
                "data": {"messageText": "@", "type": "broadcast"},
                "dataType": "object"
             }
          ]
       },
       {
          "name": "sendGroupMessage",
          "summary": " ",
          "parameters": [
             {
                "in": "formData",
                "name": "messageText",
                "description": "group message text",
                "dataType": "string"
             },
             {
                "in": "formData",
                "name": "groupId",
                "description": "group id",
                "dataType": "string"
             }
          ],
          "condition": "connect",
          "operationId": "",
          "flow": [
             {
                "action": "request", 
                "key": "changeGroup", 
                "data": {"groupId": "@"},
                "dataType": "object"
             },
             {
                "action": "request", 
                "key": "sendMessage", 
                "data": {"groupId": "@"},
                "dataType": "object"
             },
             {
                "action": "response", 
                "key": "message", 
                "data": {"messageText": "@", "groupId": "@"},
                "dataType": "object"
             }
          ]
       },
       {
          "name": "sendUserMessage",
          "summary": " ",
          "parameters": [
             {
                "in": "formData",
                "name": "messageText",
                "description": "user message text",
                "dataType": "string"
             },
             {
                "in": "formData",
                "name": "recipientId",
                "description": "recipient id",
                "dataType": "string"
             }
          ],
          "operationId": "",
          "condition": "connect",
          "flow": [
             {
                "action": "request", 
                "key": "sendMessage", 
                "data": {"messageText": "@", "type": "user", "recipientId": "@"},
                "dataType": "object"
             }
          ]
       }   
    ]


### Виконання сценаріїв

Коли опис інтерфейсу завантажено, користувач має можливість активувати ті сценарії з нього, в яких нема "condition" або відповідна умова виконана при виконанні попередніх сценаріїв.

Активований сценарій — це:

* гарненьке відображення опису сценарію;
* форма вводу параметрів
* кнопка "Try!"
* кнопка "Stop!"
* форма для вводу таймауту на чекання всіх належних responseʼів


Всі сценарії виконуються у flow-вікні — це така собі стрічка, в якій відображаються наступні типи подій (кожна своїм кольором-фонтом):
* момент початку сценарію;
* момент зупинки сценарію;
* момент успішного виконання сценарію;
* момент неуспішного виконання сценарію;
* connect;
* request;
* response.

Вочевидь, потрібні будуть певні фільтри на цій стрічці (по типу події, по назві сценарію, але, згодом, і не тільки по типу/назві, а ще й по додаткових ключах).


### Розподілене виконання сценаріїв

Щоб пекревіряти роботу кількох сокетів одночасно (наприклад, відправка повідомлення і отримання його иншим користувачем), потрібно буде форма вводу ідентифікатора групи і "групової ролі" ("відправник", "одержувач" — але можуть бути й инші варіянти) для кожного користувача. Після такого вводу користувачу повинні бути доступні фільтри на flow-стрічці з урахуванням його групи/ролі, а скрипти фіксації успіху/невдачі також враховуватимуть зафіксовану групу/роль.
