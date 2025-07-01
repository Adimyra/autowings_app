frappe.pages['adimyra-crm'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        // title should be none not set
        // title: 'Adimyra CRM', // Uncomment if you want a title
        single_column: true
    });

    // Inject CSS file
    if (!$('link#adi-crm-css').length) {
        $('<link>', {
            rel: 'stylesheet',
            type: 'text/css',
            id: 'adi-crm-css',
            href: '/assets/autowings_app/page/adimyra_crm/adimyra_crm.css'
        }).appendTo('head');
    }

    // Use page.main for content injection
    $(page.main).empty().append(`
        <div id="adi-crm-layout" style="display: flex; height: 100%;">
            <div id="adi-crm-sidebar">
                <div class="adi-crm-logo">
                    <img src="/assets/autowings_app/images/adimyra_favicon.png" alt="Adi CRM Logo" class="adi-crm-logo-img" id="adi-crm-logo-img"/>
                    <span style="font-weight:700;">Adi <span class="crm-green">CRM</span></span>
                </div>
                <div class="adi-crm-section-title">MENU</div>
                <ul class="adi-crm-menu">
                    <li><a class="adi-crm-link active" data-section="My Day"> <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="6" fill="none"/><path d="M8 12l2 2 4-4" stroke="#232b3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="6" stroke="#232b3b" stroke-width="2"/></svg>My Day</a></li>
                    <li><a class="adi-crm-link" data-section="My Leads"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M6 10l6-6 6 6M6 10v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" stroke="#232b3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 16v-4h6v4" stroke="#232b3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>My Leads</a></li>
                    <li><a class="adi-crm-link" data-section="Customers"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="#232b3b" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="#232b3b" stroke-width="2"/></svg>Customers</a></li>
                    <li><a class="adi-crm-link" data-section="Calendar"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#232b3b" stroke-width="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#232b3b" stroke-width="2" stroke-linecap="round"/></svg>Calendar</a></li>
                </ul>
                <div class="adi-crm-section-title">DATA & MORE</div>
                <ul class="adi-crm-data">
                    <li><a class="adi-crm-link" data-section="Dashboard"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zm0-8h8V3h-8v10zm-10 8h8v-6H3v6z" stroke="#232b3b" stroke-width="2"/></svg>Dashboard</a></li>
                  <li><a class="adi-crm-link" data-section="Settings"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="#232b3b" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09c.7 0 1.31-.4 1.51-1V3a2 2 0 1 1 4 0v.09c0 .7.4 1.31 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c0 .7.4 1.31 1 1.51a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.31.4-1.51 1z" stroke="#232b3b" stroke-width="2"/></svg>Settings</a></li>
                </ul>
            </div>
            <div id="adi-crm-main-content">
                <h3>Welcome to ADI CRM</h3>
                <p>Select an option from the sidebar.</p>
            </div>
        </div>
    `);

    // Add My Day to sidebar/menu if not present
    if (!$(page.main).find('.adi-crm-link[data-section="My Day"]').length) {
        let myDayLink = `<li><a class="adi-crm-link" data-section="My Day" href="#"><svg style="margin-right:10px;vertical-align:middle;" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="#a6e32d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="4"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>My Day</a></li>`;
        $(page.main).find('.adi-crm-menu').prepend(myDayLink);
    }

    // Helper: check and apply dark mode globally
    function applyDarkModeIfEnabled() {
        const isDark = window.localStorage.getItem('adi_dark_mode') === '1';
        let $layout = $(page.main).find('#adi-crm-layout');
        let $logoImg = $(page.main).find('#adi-crm-logo-img');
        if (isDark) {
            $layout.addClass('adi-dark-mode');
            $('body, html').addClass('adi-dark-mode');
            // Swap logo for dark mode
            $logoImg.attr('src', '/assets/autowings_app/images/logo_dark_mode.png');
            // Table text color fix for dark mode
            $(page.main).find('table, th, td, thead, tbody, tr').css({
                color: '#fff'
            });
            // Table heading background fix for dark mode
            $(page.main).find('thead tr').css({
                background: '#232b36'
            });
        } else {
            $layout.removeClass('adi-dark-mode');
            $('body, html').removeClass('adi-dark-mode');
            // Swap logo for light mode
            $logoImg.attr('src', '/assets/autowings_app/images/adimyra_favicon.png');
            // Reset table text color
            $(page.main).find('table, th, td, thead, tbody, tr').css({
                color: ''
            });
            $(page.main).find('thead tr').css({
                background: '#f1f1f1'
            });
        }
    }

    // Sidebar link click
    $(page.main).find('.adi-crm-link').on('click', function(e) {
        e.preventDefault();
        $(page.main).find('.adi-crm-link').removeClass('active');
        $(this).addClass('active');
        let section = $(this).data('section');
        if (section === 'My Day') {
            // My Day UI
            frappe.call({
                method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_my_day_tasks',
                callback: function(r) {
                    let tasks = r.message.tasks || [];
                    let agenda = r.message.agenda || [];
                    frappe.call({
                        method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_leads_to_follow_up',
                        callback: function(lr) {
                            let leads = lr.message || [];
                            let myDayHtml = `
                            <div style="display:flex;gap:32px;flex-wrap:wrap;">
                                <div style="flex:2;min-width:340px;">
                                    <h2 style='margin-bottom:0;'>My Day</h2>
                                    <div style='color:#7a869a;margin-bottom:24px;'>Here's your plan for today.</div>
                                    <div class='adi-settings-card' style='margin-bottom:28px;'>
                                        <div style='display:flex;align-items:center;justify-content:space-between;'>
                                            <div style='font-weight:700;font-size:1.1rem;margin-bottom:8px;'>Priority Tasks</div>
                                            <button id='adi-add-task-btn' style='background:#a6e32d;color:#fff;border:none;padding:10px 32px;border-radius:10px;font-weight:600;font-size:1.1rem;box-shadow:0 2px 8px #a6e32d22;'>+ New Task</button>
                                        </div>
                                        <div id='adi-myday-tasks-list' style='margin-top:10px;'>
                                            ${tasks.length ? tasks.map(task => `
                                                <div style='display:flex;align-items:center;margin-bottom:10px;'>
                                                    <input type='checkbox' class='adi-task-checkbox' data-id='${task.name}' ${task.status==="Closed"?"checked disabled":""} style='margin-right:12px;width:18px;height:18px;'>
                                                    <span style='${task.status==="Closed"?"text-decoration:line-through;color:#b0b4be;":""}font-size:1.05rem;'>${frappe.utils.escape_html(task.description)}</span>
                                                </div>
                                            `).join('') : `<div style='color:#b0b4be;'>No tasks for today.</div>`}
                                        </div>
                                    </div>
                                    <div class='adi-settings-card'>
                                        <div style='display:flex;align-items:center;justify-content:space-between;'>
                                            <div style='font-weight:700;font-size:1.1rem;margin-bottom:8px;'>Leads to Follow Up</div>
                                            <!-- Removed + Add Lead button -->
                                        </div>
                                        ${leads.length ? leads.map(lead => {
                                            let initials = lead.lead_name ? lead.lead_name.trim()[0].toUpperCase() : '?';
                                            let logoHtml = `<div style='width:38px;height:38px;border-radius:50%;background:#e0e0e0;color:#232b3b;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.15rem;margin-right:16px;'>${initials}</div>`;
                                            let company = lead.company_name || lead.status || lead.email_id || 'Lead';
                                            return `
                                            <div style='background:#f8fafb;border-radius:12px;padding:18px 24px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;'>
                                                <div style='display:flex;align-items:center;'>
                                                    ${logoHtml}
                                                    <div>
                                                        <div style='font-weight:700;font-size:1.08rem;'>${frappe.utils.escape_html(lead.lead_name)}</div>
                                                        <div style='color:#7a869a;font-size:0.99rem;margin-top:2px;'>${frappe.utils.escape_html(company)}</div>
                                                    </div>
                                                </div>
                                                <a href='/app/lead/${lead.name}' target='_blank' style='color:#232b3b;font-size:1.05rem;font-weight:600;text-decoration:none;opacity:0.7;'>View</a>
                                            </div>`;
                                        }).join('') : `<div style='color:#b0b4be;'>No leads to follow up.</div>`}
                                    </div>
                                </div>
                            </div>`;
                            $(page.main).find('#adi-crm-main-content').html(myDayHtml);
                            // Add Task Modal
                            $(page.main).find('#adi-add-task-btn').on('click', function() {
                                let modalHtml = `
                                <div id='adi-task-modal-bg' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;'>
                                  <div id='adi-task-modal' style='background:#fff;padding:32px 28px 24px 28px;border-radius:16px;box-shadow:0 8px 32px #0002;min-width:320px;max-width:90vw;position:relative;'>
                                    <h3 style='margin-top:0;margin-bottom:18px;font-size:1.3rem;font-weight:700;'>Add Task</h3>
                                    <form id='adi-task-form'>
                                      <div style='margin-bottom:18px;'>
                                        <label style='display:block;font-weight:600;margin-bottom:6px;'>Task Description</label>
                                        <input type='text' id='adi-task-desc' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;' required />
                                      </div>
                                      <div style='margin-bottom:18px;'>
                                        <label style='display:block;font-weight:600;margin-bottom:6px;'>Priority</label>
                                        <select id='adi-task-priority' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;'>
                                            <option value='High'>High</option>
                                            <option value='Medium' selected>Medium</option>
                                            <option value='Low'>Low</option>
                                        </select>
                                      </div>
                                      <div style='display:flex;justify-content:flex-end;gap:10px;'>
                                        <button type='button' id='adi-task-cancel' style='background:#eee;color:#232b3b;border:none;padding:8px 18px;border-radius:6px;font-weight:500;font-size:1rem;'>Cancel</button>
                                        <button type='submit' style='background:#a6e32d;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:1rem;'>Add</button>
                                      </div>
                                    </form>
                                  </div>
                                </div>`;
                                $('body').append(modalHtml);
                                $('#adi-task-cancel').on('click', function() { $('#adi-task-modal-bg').remove(); });
                                $('#adi-task-form').on('submit', function(e) {
                                    e.preventDefault();
                                    let desc = $('#adi-task-desc').val().trim();
                                    let priority = $('#adi-task-priority').val();
                                    if (!desc) return;
                                    frappe.call({
                                        method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.add_task',
                                        args: { description: desc, priority: priority },
                                        callback: function() {
                                            $('#adi-task-modal-bg').remove();
                                            $(page.main).find('.adi-crm-link[data-section="My Day"]').trigger('click');
                                        }
                                    });
                                });
                            });
                            // Task checkbox update
                            $(page.main).find('.adi-task-checkbox').on('change', function() {
                                let taskId = $(this).data('id');
                                let status = $(this).is(':checked') ? 'Closed' : 'Open';
                                frappe.call({
                                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.update_task_status',
                                    args: { task_id: taskId, status: status },
                                    callback: function() {
                                        $(page.main).find('.adi-crm-link[data-section="My Day"]').trigger('click');
                                    }
                                });
                            });
                        }
                    });
                }
            });
            return;
        } else if (section === 'My Leads') {
            // Add Lead button and leads table
            let addLeadBtn = `<button id="adi-add-lead-btn" style="background:#a6e32d;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px #a6e32d33;margin-bottom:16px;cursor:pointer;display:block;margin-left:auto;">+ Add Lead</button>`;
            $(page.main).find('#adi-crm-main-content').html('<div style="display:flex;align-items:center;justify-content:space-between;"><h3 style="margin:0;">Leads</h3>' + addLeadBtn + '</div>' +
                `<div style="overflow-x:auto;"><table id="adi-leads-table" style="width:100%; border-collapse:collapse; margin-top:20px;">
                    <thead>
                        <tr style="background:#f1f1f1;">
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-lead-filter' data-col='lead_name' placeholder='Search Name' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-lead-filter' data-col='email_id' placeholder='Search Email' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-lead-filter' data-col='status' placeholder='Search Status' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-lead-filter' data-col='phone' placeholder='Search Phone' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                        </tr>
                        <tr style="background:#f1f1f1;">
                            <th style="border:1px solid #ddd; padding:8px;">Name</th>
                            <th style="border:1px solid #ddd; padding:8px;">Email</th>
                            <th style="border:1px solid #ddd; padding:8px;">Status</th>
                            <th style="border:1px solid #ddd; padding:8px;">Phone</th>
                        </tr>
                    </thead>
                    <tbody><tr><td colspan='4'>Loading...</td></tr></tbody>
                </table></div>`);

            function fetchLeads(filters) {
                frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_leads',
                    args: Object.assign({ limit: 1000 }, filters), // fetch all for client-side filtering
                    callback: function(r) {
                        let allRows = r.message || [];
                        let filterVals = {};
                        $(page.main).find('.adi-lead-filter').each(function() {
                            let val = $(this).val().trim().toLowerCase();
                            if (val) filterVals[$(this).data('col')] = val;
                        });
                        let filteredRows = allRows.filter(lead => {
                            return Object.entries(filterVals).every(([col, val]) => {
                                return (lead[col] || '').toLowerCase().includes(val);
                            });
                        });
                        let $tbody = $(page.main).find('#adi-leads-table tbody');
                        if (filteredRows.length) {
                            let rows = filteredRows.map(lead => `
                                <tr>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${lead.lead_name || lead.name}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${lead.email_id || ''}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${lead.status || ''}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${lead.phone || ''}</td>
                                </tr>
                            `).join('');
                            $tbody.html(rows);
                        } else {
                            $tbody.html('<tr><td colspan="4">No leads found.</td></tr>');
                        }
                    }
                });
            }
            fetchLeads({});
            // Per-column filter
            $(page.main).find('.adi-lead-filter').on('input', function() {
                fetchLeads({});
            });
            // Add Lead button click - open modal
            $(page.main).find('#adi-add-lead-btn').on('click', function() {
                // Modal HTML
                let modalHtml = `
                <div id=\"adi-lead-modal-bg\" style=\"position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;\">
                  <div id=\"adi-lead-modal\" style=\"background:#fff;padding:32px 28px 24px 28px;border-radius:16px;box-shadow:0 8px 32px #0002;min-width:320px;max-width:90vw;position:relative;\">
                    <h3 style=\"margin-top:0;margin-bottom:18px;font-size:1.3rem;font-weight:700;\">Add Lead</h3>
                    <form id=\"adi-lead-form\">
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Name</label>
                        <input type=\"text\" id=\"adi-lead-name\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Mobile Number</label>
                        <input type=\"text\" id=\"adi-lead-mobile\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Email</label>
                        <input type=\"email\" id=\"adi-lead-email\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"display:flex;justify-content:flex-end;gap:10px;\">
                        <button type=\"button\" id=\"adi-lead-cancel\" style=\"background:#eee;color:#232b3b;border:none;padding:8px 18px;border-radius:6px;font-weight:500;font-size:1rem;\">Cancel</button>
                        <button type=\"submit\" style=\"background:#a6e32d;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:1rem;\">Add</button>
                      </div>
                    </form>
                  </div>
                </div>`;
                $('body').append(modalHtml);
                // Cancel button closes modal
                $('#adi-lead-cancel').on('click', function() {
                  $('#adi-lead-modal-bg').remove();
                });
                // Form submit
                $('#adi-lead-form').on('submit', function(e) {
                  e.preventDefault();
                  let name = $('#adi-lead-name').val().trim();
                  let phone = $('#adi-lead-mobile').val().trim();
                  let email = $('#adi-lead-email').val().trim();
                  if (!name || !phone) return;
                  frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.add_lead',
                    args: {
                      lead_name: name,
                      phone: phone,
                      email_id: email
                    },
                    callback: function(r) {
                      $('#adi-lead-modal-bg').remove();
                      // Refresh leads list
                      $(page.main).find('.adi-crm-link[data-section="My Leads"]').trigger('click');
                    }
                  });
                });
              });
        } else if (section === 'Customers') {
            // Customers list UI
            let addCustomerBtn = `<button id="adi-add-customer-btn" style="background:#a6e32d;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px #a6e32d33;margin-bottom:16px;cursor:pointer;display:block;margin-left:auto;">+ Add Customer</button>`;
            $(page.main).find('#adi-crm-main-content').html('<div style="display:flex;align-items:center;justify-content:space-between;"><h3 style="margin:0;">Customers</h3>' + addCustomerBtn + '</div>' +
                `<div style="overflow-x:auto;"><table id="adi-customers-table" style="width:100%; border-collapse:collapse; margin-top:20px;">
                    <thead>
                        <tr style="background:#f1f1f1;">
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-customer-filter' data-col='name' placeholder='Search ID' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-customer-filter' data-col='customer_name' placeholder='Search Full Name' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-customer-filter' data-col='mobile_no' placeholder='Search Mobile' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                            <th style="border:1px solid #ddd; padding:8px;"><input type='text' class='adi-customer-filter' data-col='email_id' placeholder='Search Email' style='width:100%;padding:4px 8px;border-radius:4px;border:1px solid #ddd;'/></th>
                        </tr>
                        <tr style="background:#f1f1f1;">
                            <th style="border:1px solid #ddd; padding:8px;">Customer ID</th>
                            <th style="border:1px solid #ddd; padding:8px;">Full Name</th>
                            <th style="border:1px solid #ddd; padding:8px;">Mobile</th>
                            <th style="border:1px solid #ddd; padding:8px;">Email</th>
                        </tr>
                    </thead>
                    <tbody><tr><td colspan='4'>Loading...</td></tr></tbody>
                </table></div>`);

            function fetchCustomers(filters) {
                frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_customers',
                    args: Object.assign({ limit: 1000 }, filters), // fetch all for client-side filtering
                    callback: function(r) {
                        let allRows = r.message || [];
                        let filterVals = {};
                        $(page.main).find('.adi-customer-filter').each(function() {
                            let val = $(this).val().trim().toLowerCase();
                            if (val) filterVals[$(this).data('col')] = val;
                        });
                        let filteredRows = allRows.filter(cust => {
                            return Object.entries(filterVals).every(([col, val]) => {
                                return (cust[col] || '').toLowerCase().includes(val);
                            });
                        });
                        let $tbody = $(page.main).find('#adi-customers-table tbody');
                        if (filteredRows.length) {
                            let rows = filteredRows.map(cust => `
                                <tr>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${cust.name}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${cust.customer_name || ''}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${cust.mobile_no || ''}</td>
                                    <td style=\"border:1px solid #ddd; padding:8px;\">${cust.email_id || ''}</td>
                                </tr>
                            `).join('');
                            $tbody.html(rows);
                        } else {
                            $tbody.html('<tr><td colspan="4">No customers found.</td></tr>');
                        }
                    }
                });
            }
            fetchCustomers({});
            // Per-column filter
            $(page.main).find('.adi-customer-filter').on('input', function() {
                fetchCustomers({});
            });
            // Add Customer button click - open modal
            $(page.main).find('#adi-add-customer-btn').on('click', function() {
                let modalHtml = `
                <div id=\"adi-customer-modal-bg\" style=\"position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;\">
                  <div id=\"adi-customer-modal\" style=\"background:#fff;padding:32px 28px 24px 28px;border-radius:16px;box-shadow:0 8px 32px #0002;min-width:320px;max-width:90vw;position:relative;\">
                    <h3 style=\"margin-top:0;margin-bottom:18px;font-size:1.3rem;font-weight:700;\">Add Customer</h3>
                    <form id=\"adi-customer-form\">
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Full Name</label>
                        <input type=\"text\" id=\"adi-customer-name\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Mobile Number</label>
                        <input type=\"text\" id=\"adi-customer-mobile\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"margin-bottom:18px;\">
                        <label style=\"display:block;font-weight:600;margin-bottom:6px;\">Email</label>
                        <input type=\"email\" id=\"adi-customer-email\" style=\"width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;\" required />
                      </div>
                      <div style=\"display:flex;justify-content:flex-end;gap:10px;\">
                        <button type=\"button\" id=\"adi-customer-cancel\" style=\"background:#eee;color:#232b3b;border:none;padding:8px 18px;border-radius:6px;font-weight:500;font-size:1rem;\">Cancel</button>
                        <button type=\"submit\" style=\"background:#a6e32d;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:1rem;\">Add</button>
                      </div>
                    </form>
                  </div>
                </div>`;
                $('body').append(modalHtml);
                // Cancel button closes modal
                $('#adi-customer-cancel').on('click', function() {
                  $('#adi-customer-modal-bg').remove();
                });
                // Form submit
                $('#adi-customer-form').on('submit', function(e) {
                  e.preventDefault();
                  let name = $('#adi-customer-name').val().trim();
                  let phone = $('#adi-customer-mobile').val().trim();
                  let email = $('#adi-customer-email').val().trim();
                  if (!name || !phone) return;
                  frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.add_customer',
                    args: {
                      customer_name: name,
                      mobile_no: phone,
                      email_id: email
                    },
                    callback: function(r) {
                      $('#adi-customer-modal-bg').remove();
                      // Refresh customers list
                      $(page.main).find('.adi-crm-link[data-section="Customers"]').trigger('click');
                    }
                  });
                });
              });
        } else if (section === 'Settings') {
            // Settings page UI
            let settingsHtml = `
                <div id="adi-settings-main">
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">Appearance</div>
                        <div class="adi-settings-row">
                            <span>Dark Mode</span>
                            <label class="adi-switch">
                                <input type="checkbox" id="dark-mode-toggle">
                                <span class="adi-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">Profile</div>
                        <div class="adi-settings-row">
                            <span>Logged in as: <b>${frappe.session && frappe.session.user ? frappe.session.user : 'User'}</b></span>
                        </div>
                        <div class="adi-settings-row">
                            <a href="/app/user-profile" style="color:#7ed321;text-decoration:none;">View/Edit Profile</a>
                        </div>
                    </div>
             
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">Feedback</div>
                        <div class="adi-settings-row">
                            <span>Have suggestions or found a bug?</span>
                            <a href="mailto:support@adimyra.com?subject=Feedback%20for%20Adimyra%20CRM" style="color:#7ed321;text-decoration:none;">Send Feedback</a>
                        </div>
                    </div>
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">Support</div>
                        <div class="adi-settings-row">
                            <span>For any issues or support, please contact us:</span>
                        </div>
                        <div class="adi-settings-row">
                            <a href="mailto:faiyaz@adimyra.com" style="color:#7ed321;text-decoration:none;">faiyaz@adimyra.com</a>
                        </div>
                        <div class="adi-settings-row">
                            <a href="tel:+919999999999" style="color:#1e2a78;text-decoration:none;">+91 70044 90431</a>
                        </div>
                        <div class="adi-settings-row">
                            <a href="https://adimyra.com/support" target="_blank" style="color:#43e97b;text-decoration:none;">Visit Support Portal</a>
                        </div>
                    </div>
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">Privacy & Security</div>
                        <div class="adi-settings-row">
                            <a href="/privacy-policy" target="_blank" style="color:#1e2a78;text-decoration:none;">Privacy Policy</a>
                        </div>
                        <div class="adi-settings-row">
                            <a href="/terms-of-service" target="_blank" style="color:#1e2a78;text-decoration:none;">Terms of Service</a>
                        </div>
                    </div>
                    <div class="adi-settings-card">
                        <div class="adi-settings-title">About</div>
                        <div class="adi-settings-row">
                            <span>Version: 1.0.0</span>
                        </div>
                        <div class="adi-settings-row">
                            <span>Developed by: Adimyra Systems Pvt Ltd</span>
                        </div>
                        <div class="adi-settings-row">
                            <a href="https://adimyra.com" target="_blank" style="color:#7ed321;text-decoration:none;">https://www.adimyra.com</a>
                        </div>
                    </div>
                </div>
            `;
            $(page.main).find('#adi-crm-main-content').html(settingsHtml);
            // Set toggle state from localStorage
            let isDark = window.localStorage.getItem('adi_dark_mode') === '1';
            $(page.main).find('#dark-mode-toggle').prop('checked', isDark);
            applyDarkModeIfEnabled();
            // Dark mode toggle logic for the whole app
            $(page.main).find('#dark-mode-toggle').on('change', function() {
                let $layout = $(page.main).find('#adi-crm-layout');
                let $logoImg = $(page.main).find('#adi-crm-logo-img');
                if ($(this).is(':checked')) {
                    $layout.addClass('adi-dark-mode');
                    $('body, html').addClass('adi-dark-mode');
                    $logoImg.attr('src', '/assets/autowings_app/images/logo_dark_mode.png');
                    window.localStorage.setItem('adi_dark_mode', '1');
                } else {
                    $layout.removeClass('adi-dark-mode');
                    $('body, html').removeClass('adi-dark-mode');
                    $logoImg.attr('src', '/assets/autowings_app/images/adimyra_favicon.png');
                    window.localStorage.setItem('adi_dark_mode', '0');
                }
                // Immediately update all dark mode styles
                applyDarkModeIfEnabled();
            });
        } else if (section === 'Calendar') {
            // Calendar UI
            frappe.call({
                method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_events_for_calendar',
                callback: function(r) {
                    let events = r.message || [];
                    let today = new Date();
                    let year = today.getFullYear();
                    let month = today.getMonth();
                    let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    let firstDay = new Date(year, month, 1).getDay();
                    let daysInMonth = new Date(year, month + 1, 0).getDate();
                    let calendarHtml = `
                    <div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;'>
                        <h2 style='margin:0;'>Calendar</h2>
                        <button id='adi-add-event-btn' style='background:#7ed321;color:#fff;border:none;padding:10px 28px;border-radius:10px;font-weight:600;font-size:1.1rem;box-shadow:0 2px 8px #a6e32d22;'><span style='font-size:1.2em;margin-right:6px;'>+</span> Add Event</button>
                    </div>
                    <div style='background:#fff;border-radius:16px;padding:24px 18px 18px 18px;box-shadow:0 2px 8px #0001;'>
                        <div style='display:flex;align-items:center;justify-content:center;margin-bottom:18px;'>
                            <span style='font-weight:600;font-size:1.2rem;'>${monthNames[month]} ${year}</span>
                        </div>
                        <table style='width:100%;border-collapse:separate;border-spacing:0 8px;'>
                            <thead>
                                <tr style='color:#b0b4be;font-weight:600;font-size:1.05rem;'>
                                    <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                                </tr>
                            </thead>
                            <tbody id='adi-calendar-body'></tbody>
                        </table>
                    </div>`;
                    $(page.main).find('#adi-crm-main-content').html(calendarHtml);
                    // Render days
                    let calendarBody = '';
                    let day = 1;
                    for (let i = 0; i < 6; i++) {
                        calendarBody += '<tr>';
                        for (let j = 0; j < 7; j++) {
                            if ((i === 0 && j < firstDay) || day > daysInMonth) {
                                calendarBody += `<td style='height:60px;background:#f8fafb;'></td>`;
                            } else {
                                let event = events.find(ev => new Date(ev.starts_on).getDate() === day && new Date(ev.starts_on).getMonth() === month && new Date(ev.starts_on).getFullYear() === year);
                                let eventHtml = event ? `<div style='background:#22c55e;color:#fff;border-radius:6px;padding:2px 8px;font-size:0.98rem;margin-top:6px;white-space:nowrap;'>${frappe.utils.escape_html(event.subject)}</div>` : '';
                                calendarBody += `<td style='height:60px;vertical-align:top;position:relative;background:${day===today.getDate()?"#eaf9d6":"#f8fafb"};'><div style='font-weight:600;'>${day}</div>${eventHtml}</td>`;
                                day++;
                            }
                        }
                        calendarBody += '</tr>';
                        if (day > daysInMonth) break;
                    }
                    $(page.main).find('#adi-calendar-body').html(calendarBody);
                    // Add Event Modal
                    $(page.main).find('#adi-add-event-btn').on('click', function() {
                        let modalHtml = `
                        <div id='adi-event-modal-bg' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;'>
                          <div id='adi-event-modal' style='background:#fff;padding:32px 28px 24px 28px;border-radius:16px;box-shadow:0 8px 32px #0002;min-width:320px;max-width:90vw;position:relative;'>
                            <h3 style='margin-top:0;margin-bottom:18px;font-size:1.3rem;font-weight:700;'>Add Event</h3>
                            <form id='adi-event-form'>
                              <div style='margin-bottom:18px;'>
                                <label style='display:block;font-weight:600;margin-bottom:6px;'>Subject</label>
                                <input type='text' id='adi-event-subject' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;' required />
                              </div>
                              <div style='margin-bottom:18px;'>
                                <label style='display:block;font-weight:600;margin-bottom:6px;'>Start Date & Time</label>
                                <input type='datetime-local' id='adi-event-starts-on' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;' required />
                              </div>
                              <div style='margin-bottom:18px;'>
                                <label style='display:block;font-weight:600;margin-bottom:6px;'>Description</label>
                                <textarea id='adi-event-desc' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;'></textarea>
                              </div>
                              <div style='display:flex;justify-content:flex-end;gap:10px;'>
                                <button type='button' id='adi-event-cancel' style='background:#eee;color:#232b3b;border:none;padding:8px 18px;border-radius:6px;font-weight:500;font-size:1rem;'>Cancel</button>
                                <button type='submit' style='background:#7ed321;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:1rem;'>Add</button>
                              </div>
                            </form>
                          </div>
                        </div>`;
                        $('body').append(modalHtml);
                        $('#adi-event-cancel').on('click', function() { $('#adi-event-modal-bg').remove(); });
                        $('#adi-event-form').on('submit', function(e) {
                            e.preventDefault();
                            let subject = $('#adi-event-subject').val().trim();
                            let starts_on = $('#adi-event-starts-on').val();
                            let desc = $('#adi-event-desc').val().trim();
                            if (!subject || !starts_on) return;
                            frappe.call({
                                method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.add_event',
                                args: { subject: subject, starts_on: starts_on, description: desc },
                                callback: function() {
                                    $('#adi-event-modal-bg').remove();
                                    $(page.main).find('.adi-crm-link[data-section="Calendar"]').trigger('click');
                                }
                            });
                        });
                    });
                }
            });
            return;
        } else if (section === 'Dashboard') {
            // Dashboard UI with date range filter
            let dateRanges = [
                { label: 'This Month', value: 'this_month' },
                { label: 'Today', value: 'today' },
                { label: 'Yesterday', value: 'yesterday' },
                { label: 'Custom', value: 'custom' }
            ];
            let selectedRange = 'this_month';
            let customFrom = '';
            let customTo = '';
            function renderDashboard(stats, range, from, to) {
                let openLeads = stats.open_leads || 0;
                let convertedLeads = stats.converted_leads || 0;
                let closedLeads = stats.closed_leads || 0;
                let totalCustomers = stats.total_customers || 0;
                let leadStatusCounts = stats.lead_status_counts || {};
                // Remove main statuses from extra status cards
                const mainStatuses = ['Open', 'Converted', 'Closed'];
                let extraStatusCards = Object.entries(leadStatusCounts)
                    .filter(([status]) => !mainStatuses.includes(status))
                    .map(([status, count]) => `
                        <div class="adi-settings-card adi-dash-card" data-type="Lead" data-status="${status}" style="flex:1;min-width:180px;text-align:center;cursor:pointer;">
                            <div style="font-size:2.2rem;font-weight:700;color:#38f9d7;">${count}</div>
                            <div style="color:#7a869a;font-size:1.05rem;">${status} Leads</div>
                        </div>
                    `).join('');
                // Number cards: leads row
                let leadCardsHtml = `
                    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:18px;">
                        <div class="adi-settings-card adi-dash-card" data-type="Lead" data-status="Open" style="flex:1;min-width:180px;text-align:center;cursor:pointer;">
                            <div style="font-size:2.2rem;font-weight:700;color:#ee0979;">${openLeads}</div>
                            <div style="color:#7a869a;font-size:1.05rem;">Open Leads</div>
                        </div>
                        <div class="adi-settings-card adi-dash-card" data-type="Lead" data-status="Converted" style="flex:1;min-width:180px;text-align:center;cursor:pointer;">
                            <div style="font-size:2.2rem;font-weight:700;color:#43e97b;">${convertedLeads}</div>
                            <div style="color:#7a869a;font-size:1.05rem;">Converted Leads</div>
                        </div>
                        <div class="adi-settings-card adi-dash-card" data-type="Lead" data-status="Closed" style="flex:1;min-width:180px;text-align:center;cursor:pointer;">
                            <div style="font-size:2.2rem;font-weight:700;color:#ff6a00;">${closedLeads}</div>
                            <div style="color:#7a869a;font-size:1.05rem;">Closed Leads</div>
                        </div>
                        ${extraStatusCards}
                    </div>`;
                // Number cards: customers row (no online users)
                let customerCardsHtml = `
                    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;">
                        <div class="adi-settings-card adi-dash-card" data-type="Customer" style="flex:1;min-width:180px;text-align:center;cursor:pointer;">
                            <div style="font-size:2.2rem;font-weight:700;color:#1e2a78;">${totalCustomers}</div>
                            <div style="color:#7a869a;font-size:1.05rem;">Total Customers</div>
                        </div>
                    </div>`;
                // Charts row (no online users chart)
                let chartHtml = `
                    <div style="display:flex;gap:32px;flex-wrap:wrap;justify-content:center;">
                        <div style="background:#fff;border-radius:18px;padding:32px 24px;box-shadow:0 2px 8px #0001;max-width:420px;flex:1;min-width:320px;cursor:pointer;" id="adi-lead-status-chart-card">
                            <h3 style='margin-bottom:18px;'>Lead Status Overview</h3>
                            <canvas id="adi-lead-status-chart" height="120"></canvas>
                        </div>
                        <div style="background:#fff;border-radius:18px;padding:32px 24px;box-shadow:0 2px 8px #0001;max-width:420px;flex:1;min-width:320px;cursor:pointer;" id="adi-customer-growth-chart-card">
                            <h3 style='margin-bottom:18px;'>Customers Growth (Date-wise)</h3>
                            <canvas id="adi-customer-growth-chart" height="120"></canvas>
                        </div>
                    </div>`;
                // Date range filter UI
                let dateFilterHtml = `
                    <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;">
                        <div style="font-weight:600;font-size:1.08rem;">Date Range:</div>
                        ${dateRanges.map(r => `
                            <button class="adi-date-range-btn${range===r.value?' active':''}" data-range="${r.value}" style="background:${range===r.value?'linear-gradient(90deg,#43e97b,#38f9d7)':'#f8fafb'};color:${range===r.value?'#fff':'#232b3b'};border:none;padding:7px 18px;border-radius:7px;font-weight:600;font-size:1rem;cursor:pointer;">${r.label}</button>
                        `).join('')}
                        <input type="date" id="adi-date-from" value="${from||''}" style="display:${range==='custom'?'inline-block':'none'};margin-left:8px;padding:6px 10px;border-radius:6px;border:1px solid #ddd;" />
                        <span style="display:${range==='custom'?'inline-block':'none'};">to</span>
                        <input type="date" id="adi-date-to" value="${to||''}" style="display:${range==='custom'?'inline-block':'none'};margin-left:2px;padding:6px 10px;border-radius:6px;border:1px solid #ddd;" />
                    </div>`;
                $(page.main).find('#adi-crm-main-content').html(`
                    <h2 style='margin-bottom:0;'>Dashboard</h2>
                    <div style='color:#7a869a;margin-bottom:24px;'>Overview of leads, customers, and online users.</div>
                    ${dateFilterHtml}
                    ${leadCardsHtml}
                    ${customerCardsHtml}
                    ${chartHtml}
                `);
                // Chart.js rendering
                if (window.Chart) {
                    // Lead status chart
                    let chartLabels = Object.keys(leadStatusCounts);
                    let chartData = Object.values(leadStatusCounts);
                    let ctx = document.getElementById('adi-lead-status-chart').getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                label: 'Leads',
                                data: chartData,
                                backgroundColor: [
                                    '#ee0979', '#43e97b', '#ff6a00', '#1e2a78', '#38f9d7', '#a6e32d'
                                ],
                                borderRadius: 8
                            }]
                        },
                        options: {
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }
                    });
                    // Customer growth chart
                    let custLabels = (stats.customer_growth_labels || []);
                    let custData = (stats.customer_growth_data || []);
                    let custCtx = document.getElementById('adi-customer-growth-chart').getContext('2d');
                    new Chart(custCtx, {
                        type: 'line',
                        data: {
                            labels: custLabels,
                            datasets: [{
                                label: 'Customers',
                                data: custData,
                                backgroundColor: 'rgba(126,211,33,0.2)',
                                borderColor: '#7ed321',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.3
                            }]
                        },
                        options: {
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }
                    });
                } else {
                    // Load Chart.js if not loaded
                    let script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                    script.onload = function() { $(page.main).find('.adi-crm-link[data-section="Dashboard"]').trigger('click'); };
                    document.head.appendChild(script);
                }
                // Click handlers for number cards
                $(page.main).find('.adi-dash-card').on('click', function() {
                    let type = $(this).data('type');
                    let status = $(this).data('status');
                    let route = '';
                    let filters = {};
                    if (type === 'Lead') {
                        route = '/app/lead';
                        if (status) filters['status'] = status;
                    } else if (type === 'Customer') {
                        route = '/app/customer';
                    }
                    if (Object.keys(filters).length) {
                        frappe.set_route(route, { filters });
                    } else {
                        frappe.set_route(route);
                    }
                });
                // Click handlers for charts
                $('#adi-lead-status-chart-card').on('click', function() {
                    frappe.set_route('/app/lead');
                });
                $('#adi-customer-growth-chart-card').on('click', function() {
                    frappe.set_route('/app/customer');
                });
                // Date range filter logic
                $(page.main).find('.adi-date-range-btn').on('click', function() {
                    let range = $(this).data('range');
                    selectedRange = range;
                    if (range !== 'custom') {
                        customFrom = '';
                        customTo = '';
                        fetchStatsAndRender(range, '', '');
                    } else {
                        // Show date pickers
                        $(page.main).find('#adi-date-from,#adi-date-to').show();
                    }
                });
                $(page.main).find('#adi-date-from,#adi-date-to').on('change', function() {
                    customFrom = $(page.main).find('#adi-date-from').val();
                    customTo = $(page.main).find('#adi-date-to').val();
                    if (customFrom && customTo) {
                        fetchStatsAndRender('custom', customFrom, customTo);
                    }
                });
            }
            function fetchStatsAndRender(range, from, to) {
                frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_dashboard_stats',
                    args: { date_range: range, from_date: from, to_date: to },
                    callback: function(r) {
                        let stats = r.message || {};
                        renderDashboard(stats, range, from, to);
                    }
                });
            }
            fetchStatsAndRender(selectedRange, customFrom, customTo);
            return;
        } else {
            $(page.main).find('#adi-crm-main-content').html(`<h3>${section}</h3><p>Content for ${section} goes here.</p>`);
            applyDarkModeIfEnabled(); // Ensure dark mode is applied after rendering
        }
    });

    // On first load, apply dark mode if enabled
    applyDarkModeIfEnabled();

    // On first load, show My Day by default
    function renderMyDay() {
        frappe.call({
            method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_my_day_tasks',
            callback: function(r) {
                let tasks = r.message.tasks || [];
                frappe.call({
                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.get_leads_to_follow_up',
                    callback: function(lr) {
                        let leads = lr.message || [];
                        let myDayHtml = `
                        <div style="display:flex;gap:32px;flex-wrap:wrap;">
                            <div style="flex:2;min-width:340px;">
                                <h2 style='margin-bottom:0;'>My Day</h2>
                                <div style='color:#7a869a;margin-bottom:24px;'>Here's your plan for today.</div>
                                <div class='adi-settings-card' style='margin-bottom:28px;'>
                                    <div style='display:flex;align-items:center;justify-content:space-between;'>
                                        <div style='font-weight:700;font-size:1.1rem;margin-bottom:8px;'>Priority Tasks</div>
                                        <button id='adi-add-task-btn' style='background:#a6e32d;color:#fff;border:none;padding:10px 32px;border-radius:10px;font-weight:600;font-size:1.1rem;box-shadow:0 2px 8px #a6e32d22;'>+ New Task</button>
                                    </div>
                                    <div id='adi-myday-tasks-list' style='margin-top:10px;'>
                                        ${tasks.length ? tasks.map(task => `
                                            <div style='display:flex;align-items:center;margin-bottom:10px;'>
                                                <input type='checkbox' class='adi-task-checkbox' data-id='${task.name}' ${task.status==="Closed"?"checked disabled":""} style='margin-right:12px;width:18px;height:18px;'>
                                                <span style='${task.status==="Closed"?"text-decoration:line-through;color:#b0b4be;":""}font-size:1.05rem;'>${frappe.utils.escape_html(task.description)}</span>
                                            </div>
                                        `).join('') : `<div style='color:#b0b4be;'>No tasks for today.</div>`}
                                    </div>
                                </div>
                                <div class='adi-settings-card'>
                                    <div style='display:flex;align-items:center;justify-content:space-between;'>
                                        <div style='font-weight:700;font-size:1.1rem;margin-bottom:8px;'>Leads to Follow Up</div>
                                        <!-- Removed + Add Lead button -->
                                    </div>
                                    ${leads.length ? leads.map(lead => {
                                        let initials = lead.lead_name ? lead.lead_name.trim()[0].toUpperCase() : '?';
                                        let logoHtml = `<div style='width:38px;height:38px;border-radius:50%;background:#e0e0e0;color:#232b3b;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.15rem;margin-right:16px;'>${initials}</div>`;
                                        let company = lead.company_name || lead.status || lead.email_id || 'Lead';
                                        return `
                                        <div style='background:#f8fafb;border-radius:12px;padding:18px 24px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;'>
                                            <div style='display:flex;align-items:center;'>
                                                ${logoHtml}
                                                <div>
                                                    <div style='font-weight:700;font-size:1.08rem;'>${frappe.utils.escape_html(lead.lead_name)}</div>
                                                    <div style='color:#7a869a;font-size:0.99rem;margin-top:2px;'>${frappe.utils.escape_html(company)}</div>
                                                </div>
                                            </div>
                                            <a href='/app/lead/${lead.name}' target='_blank' style='color:#232b3b;font-size:1.05rem;font-weight:600;text-decoration:none;opacity:0.7;'>View</a>
                                        </div>`;
                                    }).join('') : `<div style='color:#b0b4be;'>No leads to follow up.</div>`}
                                </div>
                            </div>
                        </div>`;
                        $(page.main).find('#adi-crm-main-content').html(myDayHtml);
                        // Add Task Modal
                        $(page.main).find('#adi-add-task-btn').on('click', function() {
                            let modalHtml = `
                            <div id='adi-task-modal-bg' style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;'>
                              <div id='adi-task-modal' style='background:#fff;padding:32px 28px 24px 28px;border-radius:16px;box-shadow:0 8px 32px #0002;min-width:320px;max-width:90vw;position:relative;'>
                                <h3 style='margin-top:0;margin-bottom:18px;font-size:1.3rem;font-weight:700;'>Add Task</h3>
                                <form id='adi-task-form'>
                                  <div style='margin-bottom:18px;'>
                                    <label style='display:block;font-weight:600;margin-bottom:6px;'>Task Description</label>
                                    <input type='text' id='adi-task-desc' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;' required />
                                  </div>
                                  <div style='margin-bottom:18px;'>
                                    <label style='display:block;font-weight:600;margin-bottom:6px;'>Priority</label>
                                    <select id='adi-task-priority' style='width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:1rem;'>
                                        <option value='High'>High</option>
                                        <option value='Medium' selected>Medium</option>
                                        <option value='Low'>Low</option>
                                    </select>
                                  </div>
                                  <div style='display:flex;justify-content:flex-end;gap:10px;'>
                                    <button type='button' id='adi-task-cancel' style='background:#eee;color:#232b3b;border:none;padding:8px 18px;border-radius:6px;font-weight:500;font-size:1rem;'>Cancel</button>
                                    <button type='submit' style='background:#a6e32d;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-weight:600;font-size:1rem;'>Add</button>
                                  </div>
                                </form>
                              </div>
                            </div>`;
                            $('body').append(modalHtml);
                            $('#adi-task-cancel').on('click', function() { $('#adi-task-modal-bg').remove(); });
                            $('#adi-task-form').on('submit', function(e) {
                                e.preventDefault();
                                let desc = $('#adi-task-desc').val().trim();
                                let priority = $('#adi-task-priority').val();
                                if (!desc) return;
                                frappe.call({
                                    method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.add_task',
                                    args: { description: desc, priority: priority },
                                    callback: function() {
                                        $('#adi-task-modal-bg').remove();
                                        $(page.main).find('.adi-crm-link[data-section="My Day"]').trigger('click');
                                    }
                                });
                            });
                        });
                        // Task checkbox update
                        $(page.main).find('.adi-task-checkbox').on('change', function() {
                            let taskId = $(this).data('id');
                            let status = $(this).is(':checked') ? 'Closed' : 'Open';
                            frappe.call({
                                method: 'autowings_app.autowings_app.page.adimyra_crm.adimyra_crm.update_task_status',
                                args: { task_id: taskId, status: status },
                                callback: function() {
                                    $(page.main).find('.adi-crm-link[data-section="My Day"]').trigger('click');
                                }
                            });
                        });
                    }
                });
            }
        });
    }
    // On first load, show My Day
    renderMyDay();

    // Collapsible sidebar logic (if you want to keep it, add a toggle button in your HTML and style accordingly)
    // ...existing code...
};