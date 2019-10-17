const toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000
});

const storage = window.localStorage;

/**
 * Chuck array
 * @param {[]} array Array
 * @param {Number} size Length of arrays
 */
function chunkArray(array, size) {
    const finArray = [];
    let tempArray = [];

    for (const item in array) {
        tempArray.push(item);

        if (array.length === size) {
            finArray.push(tempArray);
            tempArray = [];
        }
    }

    if (tempArray.length) {
        finArray.push(tempArray);
        tempArray = [];
    }

    return finArray;
}

/**
 * Upload file
 * @param {FileList} files file to upload
 */
async function uploadFiles(files) {
    if ($("#filedrop").attr("disabled")) return;
    $("#filedrop").prop({ disabled: true });

    const filesArray = [];

    for (let i = 0; i < files.length; i++) {
        let file = files.item(i);
        file.uid = Math.floor(Date.now() * Math.random());
        filesArray.push(file);
        if ($(".up-files-list").attr("hidden")) $(".up-files-list").removeAttr("hidden");
        $(".up-files-list").append(`
        <div class="up-file" id="${file.uid}">
            <a href="" target="_blank" style="display:none" id="img">
                <img src="" alt="${file.name}" title="${file.name}">
            </a>
            <span class="filename" title="${file.name}">${file.name}</span>
            <progress class="progress" value="0" max="100"></progress>
            <a href="" target="_blank" style="display:none" id="fileurl"></a>
            <button class="button" style="display:none">
                <span class="icon">
                    <i class="fas fa-clipboard"></i>
                </span>
                <span>Copy Link</span>
            </button>
        </div>
        `);
    }

    const chunkedArray = chunkArray(filesArray, storage.getItem("sim-up") || 2);

    for (let i = 0; i < chunkedArray.length; i++) {
        /** @type {File[]} */
        const fileArray = chunkedArray[i].map(f => {
            return files.item(f);
        });

        await Promise.all(fileArray.map(f => { return uploadFile(f) }));
    }

    return $("#filedrop").removeAttr("disabled");
}

/**
 * Upload file
 * @param {File} file file
 */
function uploadFile(file) {
    return new Promise((resolve) => {
        const domain = storage.getItem("domain");
        const data = new FormData();
        data.append("upload[]", file);

        if (domain && domain !== "random") {
            data.append("UPLOAD_DOMAIN", domain);
        }

        $.ajax({
            xhr: () => {
                var xhr = new window.XMLHttpRequest();
                xhr.addEventListener("progress", (evt) => {
                    if (evt.lengthComputable) {
                        let percentComplete = Math.round((evt.loaded / evt.total) * 100);
                        $(`#${file.uid} progress`).val(percentComplete);
                    }
                }, false);
                return xhr;
            },
            type: "POST",
            url: "/upload",
            data: data,
            processData: false,
            contentType: false,
            success: (res) => {
                const upFile = res.files[0];

                $(`#${file.uid} progress`).fadeOut(0);

                if (["jpg", "gif", "png", "bmp"].includes(file.name.split(".").pop())) {
                    $(`#${file.uid} #img`).removeAttr("style");
                    $(`#${file.uid} #img img`).prop({ src: `https://${upFile.url}`, title: upFile.filename, alt: upFile.filename });
                    $(`#${file.uid} #img`).prop({ href: `https://${upFile.url}`, title: upFile.filename });
                }

                $(`#${file.uid} #fileurl`).removeAttr("style");
                $(`#${file.uid} #fileurl`).prop({ href: `https://${upFile.url}`, title: upFile.filename });

                $(`#${file.uid} button`).removeAttr("style");

                $(`#${file.uid} button`).click((e) => {
                    e.preventDefault();

                    let clip = $("<input>");
                    $("body").append(clip);
                    clip.val(`https://${upFile.url}`).select();
                    document.execCommand("copy");
                    clip.remove();

                    toast.fire({ title: `The link has been copied to clipboard.`, type: "success" });
                });

                return resolve();
            },
            error: () => {
                toast.fire({ title: `Unable to upload ${file.name}`, type: "error" });
                return resolve();
            }
        });
    });
}

$(document).ready(() => {

    if (storage.getItem("domain")) $("#domain select").val(storage.getItem("domain"));
    if (storage.getItem("sim-up")) $("#sim-up").val(storage.getItem("sim-up"));

    $("#domain").change(() => {
        const domain = $("#domain select").val();
        const validDomain = ["rias.dxd.moe", "akeno.dxd.moe", "koneko.dxd.moe", "asia.dxd.moe", "irina.dxd.moe", "xenovia.dxd.moe", "random"];

        if (!validDomain.includes(domain))
            return toast.fire({ title: "Invalid domain", type: "error" });

        storage.setItem("domain", domain);
        return toast.fire({ title: `Default domain is now ${domain}`, type: "success" });
    });

    $("#sim-up").focusout(() => {
        const simUp = $("#sim-up").val();

        if (storage.getItem("sim-up") && storage.getItem("sim-up") == simUp) return;

        if (isNaN(simUp) || simUp < 1 || simUp.includes(".")) {
            $("#sim-up").val(2);
            storage.setItem("sim-up", 2);
            return toast.fire({ title: "Invalid value", type: "error" });
        }

        storage.setItem("sim-up", simUp);
        return toast.fire({ title: `You now upload up to ${simUp} files simultaneously`, type: "success" });
    });

    $("#config-form").submit((e) => e.preventDefault());

    $("#upload-tab a").click(() => {
        $("#upload-tab").addClass("is-active");
        $("#config-tab").removeClass("is-active");

        $("#upload-form").fadeIn(300);
        $("#config-form").fadeOut(0);
    });

    $("#config-tab a").click(() => {
        $("#upload-tab").removeClass("is-active");
        $("#config-tab").addClass("is-active");

        $("#upload-form").fadeOut(0);
        $("#config-form").fadeIn(300);
    });

    $("#filedrop").click((e) => {
        e.preventDefault();
        $("#fileinput").trigger("click");
    });

    $("#fileinput").change(async (e) => {
        e.preventDefault();

        /** @type {FileList} */
        const files = $("#fileinput")[0].files;

        uploadFiles(files);
    });

    $("#filedrop").on("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();

        $("#filedrop").css({
            color: "whitesmoke",
            border: "whitesmoke dashed 1.6px",
            "background-color": "#9f568f"
        });
    });

    $("#filedrop").on("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();

        $("#filedrop").css({
            color: "whitesmoke",
            border: "whitesmoke dashed 1.6px",
            "background-color": "#9f568f"
        });
    });

    $("#filedrop").on("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();

        $("#filedrop").removeAttr("style");
    });

    $("#filedrop").on('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        $("#filedrop").removeAttr("style");

        if (e.originalEvent.dataTransfer) {
            if (e.originalEvent.dataTransfer.files.length) {
                uploadFiles(e.originalEvent.dataTransfer.files);
            }
        }
    });

    $("#sharex-config").submit((e) => {
        e.preventDefault();

        const domain = $("#domain-choise select").val();
        const validDomain = ["rias.dxd.moe", "akeno.dxd.moe", "random"];

        if (!validDomain.includes(domain))
            return toast.fire({ title: "Invalid domain", type: "error" });

        let config;

        if (domain === "random") {
            config = `
            {
                "Version": "12.4.1",
                "Name": "DxD dot MOE",
                "DestinationType": "ImageUploader, FileUploader",
                "RequestMethod": "POST",
                "RequestURL": "https://dxd.moe/upload",
                "Body": "MultipartFormData",
                "FileFormName": "upload[]",
                "URL": "https://$json:files[0].url$",
                "ThumbnailURL": "https://$json:files[0].url$"
              }
            `;
        } else {
            config = `
            {
                "Version": "12.4.1",
                "Name": "DxD dot MOE",
                "DestinationType": "ImageUploader, FileUploader",
                "RequestMethod": "POST",
                "RequestURL": "https://dxd.moe/upload",
                "Body": "MultipartFormData",
                "Arguments": {
                  "UPLOAD_DOMAIN": "${domain}"
                },
                "FileFormName": "upload[]",
                "URL": "https://$json:files[0].url$",
                "ThumbnailURL": "https://$json:files[0].url$"
              }
            `;
        }

        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        let blob = new Blob([config], { type: "octet/stream" });
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = "dxd-moe.sxcu";
        a.click();
        window.URL.revokeObjectURL(url);
    });

});