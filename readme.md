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
       "schemes": ["socket.io"],
       "scenarios": []
    }


### Сценарії

Сценарій (елемент списку "scenarios") — це обʼєкт наступної структури (для прикладу):
       {
          "name": "connect to socket.io",
          "summary": " ",                                       // вербальний опис
          "parameters": [
             {             
                "in": "@formData",                              // слід взяти дані з форми  
                "name": "namespace",
                "description": "connect to socket.io",          // вербальний опис
                "type": "string"
             }
          ],
          "operationId": "WS connect",                          // буде зафіксовано при успішному виконанні flow
          "flow": [
              ["connect", "socket.io", {"token": "@"}]          // конект до socket.io
          ],
       },


       {
          "name": "sendGroupMessage",
          "summary": " ",
          "parameters": [
             {
                "in": "@formData",
                "name": "messageText",
                "description": "group message text",
                "type": "string"
             },
             {
                "in": "@formData",
                "name": "groupId",
                "description": "group id",
                "type": "string"
             }
          ],
          "condition": "connect",                                // сценарій чинний тільки якщо зафіксовано успіх з "WS connect"
          "operationId": "",
          "flow": [
              ["request", "changeGroup", {"groupId": "@"}],
              ["request", "sendMessage", {"messageText": "@", "type": "group", "groupId": "@"}],
              ["response", "message",    {"messageText": "@", "groupId": "@"}]
          ]
       },



### Виконання сценаріїв

Коли опис інтерфейсу завантажено, користувач має можливість активувати ті сценарії з нього, в яких нема "condition" або відповіднау мова виконана при виконанні попередніх сценаріїв.

Активований сценарій — це:

* гарненьке відображення опису сценарію;
* форма вводу параметрів
* кнопка "Try!"
* кнопка "Stop!"


Всі сценарії виконуються у flow-вікні — це така собі стрічка, в якій відображаються наступні типи подій (кожна своїм кольором-фонтом):
* момент початку сценарію;
* момент зупинки сценарію;
* момент успішного виконання сценарію;
* момент неуспішного виконання сценарію;
* connect;
* request;
* response.

Вочевидь, потрібні будудть певні фільтри на цій стрічці (по типу події, по назві сценарію, але, згодом, і не тільки по типуҐназві, а ще й по додаткових ключах).
