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
            var injector = angular.injector(['my'])
            angular.forEach(services, function(service){
                var pair = {}
                pair[service] = injector.get(service)
                self.services.push(pair)
            })
            console.log("Serivces injected:", self.services)
        }

        this.$get = function () {
            return {
                tokenSaved: function(){
                    $loginStateProvider.authenticated(true)
                    console.log('loggedIn')
                },

                tokenRemoved: function(){
                    $loginStateProvider.authenticated(true)
                    console.log('loggedOut')
                },

            }
        }
    })
