/**
 *	This file contains helper functions for creating menus in tinymce.
 */

/**
 * Renders a context menue
 * 
 * How to use: Register an action to the event "onContextmenu" with the editor. Than call this method.
 * Remember to use $('.mce-contextmenu').css({'visibility':'visible'}); if you want to show default menu.
 *
 * @param String[] menuItems  Menu items to render
 * @param {event}  event     Event to handle
 */
function renderContextMenu(menuItems, event) {
    var menu;

    // Hide default contextmenu
    $('.mce-contextmenu').css({'visibility': 'hidden'});

    event.preventDefault();

    // Render menu
    if (!menu) {
        var items = [];

        menu = new tinymce.ui.Menu({
            items: menuItems,
            context: 'contextmenu'
        });

        // allow css to target this special menu
        //menu.addClass('ccontextmenu');

        menu.renderTo(document.body);

        tinyMCE.activeEditor.on('remove', function () {
            menu.remove();
            menu = null;
        });
    } else {
        menu.show();
    }

    // Position menu
    var pos = {x: event.pageX, y: event.pageY};

    if (!tinyMCE.activeEditor.inline) {
        pos = tinymce.DOM.getPos(tinyMCE.activeEditor.getContentAreaContainer());
        pos.x += event.clientX;
        pos.y += event.clientY;
    }

    menu.moveTo(pos.x, pos.y);
}