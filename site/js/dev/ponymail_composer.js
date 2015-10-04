/*
 Licensed to the Apache Software Foundation (ASF) under one or more
 contributor license agreements.  See the NOTICE file distributed with
 this work for additional information regarding copyright ownership.
 The ASF licenses this file to You under the Apache License, Version 2.0
 (the "License"); you may not use this file except in compliance with
 the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/


function saveDraft() {
    // If the user was composing a new thread, let's save the contents (if any) for next time
    if (composeType == "new") {
        if (typeof(window.sessionStorage) !== "undefined") {
            window.sessionStorage.setItem("reply_body_" + xlist, document.getElementById('reply_body').value)
            window.sessionStorage.setItem("reply_subject_" + xlist, document.getElementById('reply_subject').value)
            window.sessionStorage.setItem("reply_list", xlist)
        }
        composeType = ""
    }
}

// hideComposer: hide the composer (splash) window
function hideComposer(evt) {
    var es = evt ? (evt.target || evt.srcElement) : null;
    if (!es || !es.getAttribute || !es.getAttribute("class") || (es.nodeName != 'A' && es.getAttribute("class").search(/label/) == -1))  {
        saveDraft()
        document.getElementById('splash').style.display = "none"
    }
}




// sendEmail: send an email
function sendEmail(form) {
    
    var f = new FormData();
    for (var k in compose_headers) {
        f.append(k, compose_headers[k])
    }
    f.append("subject", document.getElementById('reply_subject').value)
    f.append("body", document.getElementById('reply_body').value)
    
    var request = new XMLHttpRequest();
    request.open("POST", "/compose.lua");
    request.send(f);
    
    var obj = document.getElementById('splash')
    obj.innerHTML = "<h3>Email dispatched!</h3><p>Provided it passes spam checks, your email should be on its way to the mailing list now. <br/><b>Do note:</b> Some lists are always moderated, so your reply may be held for moderation for a while.</p>"
    window.setTimeout(hideComposer, 4000)
}


// compose: render a compose dialog for a reply to an email
function compose(eid, lid, type) {
    var email
    if (lid) {
        email = {
            'message-id': "",
            'list': xlist.replace("@", "."),
            'subject': "",
            'body': "",
            'from': "",
            'date': ""
        }
        composeType = "new"
    }
    else {
        composeType = "reply"
        email = saved_emails[eid]
    }
    if (email) {
        if (login.credentials) {
            
            var listname = email['list'].replace(/[<>]/g, "").replace(/^([^.]+)\./, "$1@")
            compose_headers = {
                'in-reply-to': email['message-id'],
                'references': email['message-id'] + " " + (email['references'] ? email['references'] : ""),
                'to': listname
            }
            var obj = document.getElementById('splash')
            obj.style.display = "block"
            what = "Reply to email"
            if (lid) {
                what = "Start a new thread"
            }
            obj.innerHTML = "<p style='text-align: right;'><a href='javascript:void(0);' onclick='hideComposer(event)' style='color: #FFF;'>Hit escape to close this window or click here<big> &#x2612;</big></a></p><h3>" + what + " on " + listname + ":</h3>"
            var area = document.createElement('textarea')
            area.style.width = "660px"
            area.style.height = "400px";
            area.setAttribute("id", "reply_body")
            var eml = "\n\nOn " + email.date + ", " + email.from.replace(/</mg, "&lt;") + " wrote: \n"
            email.body = email.body.replace(/\r/mg, "")
            eml += email.body.replace(/^([^\n]*)/mg, "&gt; $1")
            var eml_raw = "\n\nOn " + email.date + ", " + email.from + " wrote: \n"
            eml_raw += email.body.replace(/^([^\n]*)/mg, "> $1")

            var subject = "Re: " + email.subject.replace(/^Re:\s*/mg, "").replace(/</mg, "&lt;")
            
            if (lid) {
                eml = ""
                eml_raw = ""
                subject = ""
            }
            obj.appendChild(document.createTextNode('Subject: '))
            var txt = document.createElement('input')
            txt.setAttribute("type", "text")
            txt.setAttribute("style", "width: 500px;")
            txt.value = subject
            txt.setAttribute("id", "reply_subject")
            obj.appendChild(txt)

            area.innerHTML = eml
            obj.appendChild(area)
            
            // Do we need to fetch cache here?
            if (composeType == "new" && typeof(window.sessionStorage) !== "undefined" &&
                window.sessionStorage.getItem("reply_subject_" + xlist)) {
                area.innerHTML = window.sessionStorage.getItem("reply_body_" + xlist)
                txt.value = window.sessionStorage.getItem("reply_subject_" + xlist)
            }

            // submit button
            var btn = document.createElement('input')
            btn.setAttribute("type", "button")
            btn.setAttribute("class", "btn btn-success")
            btn.style.background = "#51A351 !important"
            btn.setAttribute("value", lid ? "Send email" : "Send reply")
            btn.setAttribute("onclick", "sendEmail(this.form)")
            obj.appendChild(btn)
            
            
            
            // reply-via-mua button
            if (!lid) {
                var xlink = 'mailto:' + listname + "?subject=" + escape(subject) + "&amp;In-Reply-To=" + escape(email['message-id']) + "&body=" + escape(eml_raw)
                var btn = document.createElement('input')
                btn.setAttribute("type", "button")
                btn.setAttribute("class", "btn btn-info")
                btn.style.float = "right"
                btn.style.background = "#51A351 !important"
                btn.setAttribute("value", "reply via your own mail client")
                btn.setAttribute("onclick", "location.href=\"" + xlink + "\";")
                obj.appendChild(btn)
            }
            
            
            // Focus on body or subject, depending on what's going on
            area.focus()
            if (composeType == "new" && txt.value.length == 0) {
                txt.focus()
            }
        } else {
            var eml_raw = "\n\nOn " + email.date + ", " + email.from + " wrote: \n"
            eml_raw += email.body.replace(/([^\r\n]*)/mg, "> $1")
            var subject = "Re: " + email.subject.replace(/^Re:\s*/mg, "").replace(/</mg, "&lt;")
            var link = 'mailto:' + email.list.replace(/[<>]/g, "").replace(/([^.]+)\./, "$1@") + "?subject=" + escape(subject) + "&In-Reply-To=" + escape(email['message-id']) + "&body=" + escape(eml_raw)
            var obj = document.getElementById('splash')
            obj.style.display = "block"
            obj.innerHTML = "<p style='text-align: right;'><a href='javascript:void(0);' onclick='hideComposer(event)' style='color: #FFF;'>Hit escape to close this window or click here<big> &#x2612;</big></a></p><h3>Reply to email:</h3>"
            obj.innerHTML += "<p>You need to be logged in to reply online.<br/>If you have a regular mail client, you can reply to this email by clicking below:<br/><h4><a style='color: #FFF;' class='btn btn-success' onclick='hideComposer(event);' href=\"" + link + "\">Reply via Mail Client</a></h4>"
        }
    }
}
