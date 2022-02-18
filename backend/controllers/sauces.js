const Sauce = require('../models/sauce');
const fs = require('fs');
const validator = require('validator');

exports.createSauce = (req, res, next) => {
    let checkedSave = true;
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    let arrayValues = Object.values(sauceObject);
    for(value in arrayValues) {
        if(validator.contains(arrayValues[value].toString(), '$') || validator.contains(arrayValues[value].toString(), '=')) {
            console.log('La saisie suivante est invalide: ' + arrayValues[value]);
            checkedSave = false;
        };
    };

    if(checkedSave) {
        const sauce = new Sauce({
            ...sauceObject,
            likes: 0,
            dislikes: 0,
            usersLiked: [],
            usersDisliked: [],
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });
        sauce.save()
            .then(() => res.status(201).json({ message: 'Sauce enregistrée'}))
            .catch(error => res.status(400).json({ error }));
    };
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(404).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    let checkedSave = true;
    if(req.file) {
        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, (err) => {
                    if(err) throw err;
                });
            })
            .catch(error => res.status(400).json({ error }));
    }

    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : {...req.body};

    let arrayValues = Object.values(sauceObject);
    for(value in arrayValues) {
        if(validator.contains(arrayValues[value].toString(), '$') || validator.contains(arrayValues[value].toString(), '=')) {
            console.log('La saisie suivante est invalide: ' + arrayValues[value]);
            checkedSave = false;
        };
    };

    if(checkedSave) {
        Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({ message: 'Sauce modifiée'}))
            .catch(error => res.status(400).json({ error }));
    } else {
        res.status(401).json({ error: 'Présence de caractères non autorisés'});
    };
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce supprimée'}))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if(sauce.usersDisliked.indexOf(req.body.userId) == -1 && sauce.usersLiked.indexOf(req.body.userId) == -1) {
                if(req.body.like == 1) {
                    sauce.usersLiked.push(req.body.userId);
                    sauce.likes += req.body.like;
                } else if(req.body.like == -1) {
                    sauce.usersDisliked.push(req.body.userId);
                    sauce.dislikes -= req.body.like;
                };
            };
            if(sauce.usersLiked.indexOf(req.body.userId) != -1 && req.body.like == 0) {
                const likesUserIndex = sauce.usersLiked.findIndex(user => user === req.body.userId);
                sauce.usersLiked.splice(likesUserIndex, 1);
                sauce.likes -= 1;
            };
            if(sauce.usersDisliked.indexOf(req.body.userId) != -1 && req.body.like == 0) {
                const likesUserIndex = sauce.usersDisliked.findIndex(user => user === req.body.userId);
                sauce.usersDisliked.splice(likesUserIndex, 1);
                sauce.dislikes -= 1;
            }
            sauce.save();
            res.status(201).json({ message: 'Like / Dislike mis à jour' });
        })
        .catch(error => res.status(500).json({ error }));
};