const request = require('request');
const httpServer = require('../lib/http');

const config = {
    port: '3333'    
};

let UserModel = {
    find: () => {
        return Promise.resolve([
            {
                chatId: 1,
                number: '791234'
            },
            {
                chatId: 2,
                number: '739156'
            }
        ]);
    },
    findOne: ({number}) => {
        if (number == '791234') {
            return Promise.resolve({
                chatId: 1,  
                number: '791234'
            });
        } else {
            return Promise.resolve(null);
        }
    }
};

let telegramApp = {
    telegram: {
        sendMessage: (chatId, text) => {
            console.log(chatId, text);
        }
    }
};

let auth = {
    users: {
        'test': 'test'
    }
};

describe('number', () => {
    it('should return 200 response code on index', (done) => {
        let http = new httpServer(telegramApp, UserModel);
        
        var s = http.expressApp.listen(config.port, () => {
            let endpoint = 'http://localhost:' + config.port + '/';
            request.get(endpoint, (error, response) => {
                expect(response.statusCode).toEqual(200);
                s.close(done);
            });
        });
    });

    it('should return 200 on post data to exist phone number', (done) => {
        let http = new httpServer(telegramApp, UserModel);
        
        var s = http.expressApp.listen(config.port, () => {
            let endpoint = 'http://localhost:' + config.port + '/send/791234';
            let data = {text: 'test text'};

            request.post(endpoint,{body: data, json: true}, (error, response) => {
                expect(response.statusCode).toEqual(200);
                s.close(done);
            });
        });
    });

    it('should return 404 on post data to unexist phone number', (done) => {
        let http = new httpServer(telegramApp, UserModel);
        
        var s = http.expressApp.listen(config.port, () => {
            let endpoint = 'http://localhost:' + config.port + '/send/8989';
            let data = {text: 'test text'};

            request.post(endpoint,{body: data, json: true}, (error, response) => {
                expect(response.statusCode).toEqual(404);
                s.close(done);
            });
        });
    });


    it('should return 404 on auth', (done) => {
        let http = new httpServer(telegramApp, UserModel, auth);
        
        var s = http.expressApp.listen(config.port, () => {
            let endpoint = 'http://localhost:' + config.port + '/send/8989';
            let data = {text: 'test text'};

            request.post(endpoint,{
                    body: data, 
                    json: true ,
                    auth: {
                        'user': 'test',
                        'pass': 'test',
                    }
                }, (error, response) => {
                    expect(response.statusCode).toEqual(404);
                    s.close(done);
                });
        });
    });

    it('should return 200 on auth', (done) => {
        let http = new httpServer(telegramApp, UserModel, auth);
        
        var s = http.expressApp.listen(config.port, () => {
            let endpoint = 'http://localhost:' + config.port + '/send/791234';
            let data = {text: 'test text'};

            request.post(endpoint,{
                    body: data, 
                    json: true ,
                    auth: {
                        'user': 'test',
                        'pass': 'test',
                    }
                }, (error, response) => {
                    expect(response.statusCode).toEqual(200);
                    s.close(done);
                });
        });
    });
});