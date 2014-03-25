angular.module('loginInjectorService', [])
    .provider('$loginState', function () {
        this.states = {
            authenticated: false
        }

        this.authenticated = function(value){
            if(angular.isDefined(value))
                return self.states.authenticated = value
            else
                return self.states.authenticated
        }

        function LoginState(state){
            this.states.authenticated = state;
        }

        var self = this;
        this.$get = function(state){
            return new LoginState(state)
        };
    })
    .provider('loginInjectorService', function ($injector, $loginStateProvider) { 
        this.services = []

        var self = this;
        this.inject = function(services){
            angular.forEach(services, function(service){
                var pair = {}
                pair[service] = null;
                self.services.push(pair)
            })
            console.log("Serivces injected:", self.services)
        }

        this.$get = function () {
            return {
                tokenSaved: function(){
                    $loginStateProvider.authenticated(true)
                    console.log('loggedIn')

                    var injector = angular.injector(['my'])
                    angular.forEach(self.services, function(service){
                        var serviceName = Object.keys(service)[0]
                        self.services[serviceName] = injector.get(serviceName)
                    })

                    console.log("Serivces injected:", self.services)

                },

                tokenRemoved: function(){
                    $loginStateProvider.authenticated(true)
                    console.log('loggedOut')
                    angular.forEach(self.services, function(service){
                        var serviceName = Object.keys(service)[0]
                        var val = self.services[serviceName];
                        delete val;
                        self.services[serviceName] = null;
                    })

                    console.log("Serivces injected:", self.services)
                },

            }
        }
    })
