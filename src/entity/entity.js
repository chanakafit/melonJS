/*
 * MelonJS Game Engine
 * Copyright (C) 2011 - 2014 Olivier Biot, Jason Oster, Aaron McLeod
 * http://www.melonjs.org
 *
 */

(function () {

    /**
     * a Generic Object Entity<br>
     * @class
     * @extends me.Renderable
     * @memberOf me
     * @constructor
     * @param {Number} x the x coordinates of the entity object
     * @param {Number} y the y coordinates of the entity object
     * @param {Object} settings Entity properties, to be defined through Tiled or when caling the entity constructor
     * <img src="images/object_properties.png"/>
     * @param {String} [settings.name] object entity name
     * @param {String} [settings.id] object unique IDs
     * @param {String} [settings.image] resource name of a spritesheet to use for the entity renderable component
     * @param {Number} [settings.framewidth] width of a single frame in the given spritesheet
     * @param {Number} [settings.frameheight] height of a single frame in the given spritesheet
     * @param {String} [settings.type] object type
     * @param {Number} [settings.collisionMask] Mask collision detection for this object
     */
    me.Entity = me.Renderable.extend(
    /** @scope me.Entity.prototype */
    {
        /** @ignore */
        init : function (x, y, settings) {

            /**
             * The entity renderable object (if defined)
             * @public
             * @type me.Renderable
             * @name renderable
             * @memberOf me.Entity
             */
            this.renderable = null;

            /**
             * The bounding rectangle for this entity
             * @protected
             * @type {me.Rect}
             * @name bounds
             * @memberOf me.Ellipse
             */
            this.bounds = undefined;

            // ensure mandatory properties are defined
            if ((typeof settings.width !== "number") || (typeof settings.height !== "number")) {
                throw new me.Entity.Error("height and width properties are mandatory when passing settings parameters to an object entity");
            }

            // call the super constructor
            this._super(me.Renderable, "init", [x, y,
                        settings.width,
                        settings.height]);

            if (settings.image) {
                var image = typeof settings.image === "object" ? settings.image : me.loader.getImage(settings.image);
                this.renderable = new me.AnimationSheet(0, 0, {
                    "image" : image,
                    "framewidth" : ~~(settings.framewidth || settings.width),
                    "frameheight" : ~~(settings.frameheight || settings.height),
                    "spacing" : ~~settings.spacing,
                    "margin" : ~~settings.margin
                });

                // check for user defined transparent color
                if (settings.transparent_color) {
                    this.renderable.setTransparency(settings.transparent_color);
                }
            }

            /**
             * Entity name<br>
             * as defined in the Tiled Object Properties
             * @public
             * @type String
             * @name name
             * @memberOf me.Entity
             */
            this.name = settings.name ? settings.name.toLowerCase() : "";

            /**
             * object type (as defined in Tiled)
             * @public
             * @type String
             * @name type
             * @memberOf me.Entity
             */
            this.type = settings.type;

            /**
             * object unique ID (as defined in Tiled)
             * @public
             * @type Number
             * @name id
             * @memberOf me.Entity
             */
            this.id = settings.id;

            /**
             * dead/living state of the entity<br>
             * default value : true
             * @public
             * @type Boolean
             * @name alive
             * @memberOf me.Entity
             */
            this.alive = true;

            /**
             * the entity body object
             * @public
             * @type me.Body
             * @name body
             * @memberOf me.Entity
             */
            // initialize the default body
            this.body = new me.Body(this, (
                typeof (settings.getTMXShapes) === "function" ?
                settings.getTMXShapes() : []
            ));

            // ensure the entity bounds and pos are up-to-date
            this.body.updateBounds();

            // resize the entity if required
            if (this.width === 0 && this.height === 0) {
                this.resize(this.body.width, this.body.height);
            }

            // set the  collision mask if defined
            if (typeof(settings.collisionMask) !== "undefined") {
                this.body.setCollisionMask(settings.collisionMask);
            }

            // set the  collision mask if defined
            if (typeof(settings.collisionType) !== "undefined") {
                if (typeof me.collision.types[settings.collisionType] !== "undefined") {
                    this.body.collisionType = me.collision.types[settings.collisionType];
                } else {
                    throw new me.Entity.Error("Invalid value for the collisionType property");
                }
            }
        },

       /**
         * returns the bounding box for this entity, the smallest rectangle object completely containing this entity body shapes
         * @name getBounds
         * @memberOf me.Entity
         * @function
         * @return {me.Rect} this entity bounding box Rectangle object
         */
        getBounds : function () {
            return this.bounds;
        },

        /**
         * update the entity bounding rect (private)
         * when manually update the entity pos, you need to call this function
         * @protected
         * @name updateBounds
         * @memberOf me.Entity
         * @function
         */
        updateBounds : function () {
            if (!this.bounds) {
                this.bounds = new me.Rect(0, 0, 0, 0);
            }
            this.bounds.pos.setV(this.pos).add(this.body.pos);
            this.bounds.resize(this.body.width, this.body.height);
            return this.bounds;
        },

        /**
         * return the distance to the specified entity
         * @name distanceTo
         * @memberOf me.Entity
         * @function
         * @param {me.Entity} entity Entity
         * @return {Number} distance
         */
        distanceTo: function (e) {
            // the me.Vector2d object also implements the same function, but
            // we have to use here the center of both entities
            var dx = (this.pos.x + (this.width / 2))  - (e.pos.x + (e.width / 2));
            var dy = (this.pos.y + (this.height / 2)) - (e.pos.y + (e.height / 2));
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * return the distance to the specified point
         * @name distanceToPoint
         * @memberOf me.Entity
         * @function
         * @param {me.Vector2d} vector vector
         * @return {Number} distance
         */
        distanceToPoint: function (v) {
            // the me.Vector2d object also implements the same function, but
            // we have to use here the center of both entities
            var dx = (this.pos.x + (this.width / 2))  - (v.x);
            var dy = (this.pos.y + (this.height / 2)) - (v.y);
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * return the angle to the specified entity
         * @name angleTo
         * @memberOf me.Entity
         * @function
         * @param {me.Entity} entity Entity
         * @return {Number} angle in radians
         */
        angleTo: function (e) {
            var a = this.getBounds();
            var b = e.getBounds();
            // the me.Vector2d object also implements the same function, but
            // we have to use here the center of both entities
            var ax = (b.pos.x + (b.width / 2)) - (a.pos.x + (a.width / 2));
            var ay = (b.pos.y + (b.height / 2)) - (a.pos.y + (a.height / 2));
            return Math.atan2(ay, ax);
        },

        /**
         * return the angle to the specified point
         * @name angleToPoint
         * @memberOf me.Entity
         * @function
         * @param {me.Vector2d} vector vector
         * @return {Number} angle in radians
         */
        angleToPoint: function (v) {
            var a = this.getBounds();
            // the me.Vector2d object also implements the same function, but
            // we have to use here the center of both entities
            var ax = (v.x) - (a.pos.x + (a.width / 2));
            var ay = (v.y) - (a.pos.y + (a.height / 2));
            return Math.atan2(ay, ax);
        },

        /** @ignore */
        update : function (dt) {
            if (this.renderable) {
                return this.renderable.update(dt);
            }
            this._super(me.Renderable, "update", [dt]);
            return false;
        },

        /**
         * object draw<br>
         * not to be called by the end user<br>
         * called by the game manager on each game loop
         * @name draw
         * @memberOf me.Entity
         * @function
         * @protected
         * @param {Context2d} context 2d Context on which draw our object
         **/
        draw : function (renderer) {
            // draw the sprite if defined
            if (this.renderable) {
                // translate the renderable position (relative to the entity)
                // and keeps it in the entity defined bounds
                var _bounds = this.getBounds();

                var x = ~~(0.5 + _bounds.pos.x + (
                    this.anchorPoint.x * (_bounds.width - this.renderable.width)
                ));
                var y = ~~(0.5 + _bounds.pos.y + (
                    this.anchorPoint.y * (_bounds.height - this.renderable.height)
                ));
                renderer.translate(x, y);
                this.renderable.draw(renderer);
                renderer.translate(-x, -y);
            }
        },

        /**
         * Destroy function<br>
         * @ignore
         */
        destroy : function () {
            // free some property objects
            if (this.renderable) {
                this.renderable.destroy.apply(this.renderable, arguments);
                this.renderable = null;
            }
            this.body.destroy.apply(this.body, arguments);
            this.body = null;
        },

        /**
         * OnDestroy Notification function<br>
         * Called by engine before deleting the object
         * @name onDestroyEvent
         * @memberOf me.Entity
         * @function
         */
        onDestroyEvent : function () {
            // to be extended !
        },

        /**
         * onCollision callback<br>
         * triggered in case of collision, when this entity body is being "touched" by another one<br>
         * @name onCollision
         * @memberOf me.Entity
         * @function
         * @param {me.collision.ResponseObject} response the collision response object
         * @param {me.Entity} other the other entity touching this one (a reference to response.a or response.b)
         * @return {Boolean} true if the object should respond to the collision (its position and velocity will be corrected)
         */
        onCollision : function () {
            return false;
        }
    });

    /*
     * A Collectable entity
     */

    /**
     * @class
     * @extends me.Entity
     * @memberOf me
     * @constructor
     * @param {Number} x the x coordinates of the entity object
     * @param {Number} y the y coordinates of the entity object
     * @param {me.ObjectSettings} settings Object Properties as defined in Tiled<br>
     */
    me.CollectableEntity = me.Entity.extend(
    /** @scope me.CollectableEntity.prototype */
    {
        /** @ignore */
        init : function (x, y, settings) {
            // call the super constructor
            this._super(me.Entity, "init", [x, y, settings]);
            this.body.collisionType = me.collision.types.COLLECTABLE_OBJECT;
        }
    });

    /*
     * A level entity
     */

    /**
     * @class
     * @extends me.Entity
     * @memberOf me
     * @constructor
     * @param {Number} x the x coordinates of the object
     * @param {Number} y the y coordinates of the object
     * @param {me.ObjectSettings} settings object settings
     * @example
     * me.game.world.addChild(new me.LevelEntity(
     *     x, y, {
     *         "duration" : 250, // Fade duration (in ms)
     *         "color" : "#000", // Fade color
     *         "to" : "mymap2"   // TMX level to load
     *     }
     * ));
     */
    me.LevelEntity = me.Entity.extend(
    /** @scope me.LevelEntity.prototype */
    {
        /** @ignore */
        init : function (x, y, settings) {
            this._super(me.Entity, "init", [x, y, settings]);

            this.nextlevel = settings.to;

            this.fade = settings.fade;
            this.duration = settings.duration;
            this.fading = false;

            this.name = "levelEntity";

            // a temp variable
            this.gotolevel = settings.to;

            this.body.collisionType = me.collision.types.ACTION_OBJECT;
        },

        /**
         * @ignore
         */
        onFadeComplete : function () {
            me.levelDirector.loadLevel(this.gotolevel);
            me.game.viewport.fadeOut(this.fade, this.duration);
        },

        /**
         * go to the specified level
         * @name goTo
         * @memberOf me.LevelEntity
         * @function
         * @param {String} [level=this.nextlevel] name of the level to load
         * @protected
         */
        goTo : function (level) {
            this.gotolevel = level || this.nextlevel;
            // load a level
            //console.log("going to : ", to);
            if (this.fade && this.duration) {
                if (!this.fading) {
                    this.fading = true;
                    me.game.viewport.fadeIn(this.fade, this.duration,
                            this.onFadeComplete.bind(this));
                }
            } else {
                me.levelDirector.loadLevel(this.gotolevel);
            }
        },

        /** @ignore */
        onCollision : function () {
            if (this.name === "levelEntity") {
                this.goTo();
            }
            return false;
        }
    });

    /**
     * Base class for Entity exception handling.
     * @name Error
     * @class
     * @memberOf me.Entity
     * @constructor
     * @param {String} msg Error message.
     */
    me.Entity.Error = me.Renderable.Error.extend({
        init : function (msg) {
            this._super(me.Renderable.Error, "init", [ msg ]);
            this.name = "me.Entity.Error";
        }
    });
})();
