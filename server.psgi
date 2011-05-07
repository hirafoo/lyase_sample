use strict;
use warnings;

{
    package MyServer;
    use Class::Accessor::Lite (
        new => 1,
        rw  => [qw/action xt/],
    );
    use Data::Dumper qw/Dumper/;
    use Encode qw/find_encoding/;
    use Encode::JavaScript::UCS;
    use Path::Class;
    use Plack::Builder;
    use Plack::Request;
    use Text::Xslate;
    use JSON::XS ();

    my ($utf, $js) = (find_encoding('utf-8'), find_encoding('JavaScript-UCS'));
    sub utf { $utf }
    sub js { $js }

    sub init {
        my ($self) = @_;

        $self->xt(
            Text::Xslate->new(
                syntax => 'TTerse',
                path => ["./template/"],
                cache => 0,
                function => +{
                    link => sub {
                        my ($href, $text) = @_;
                        $text ||= $href;
                        Text::Xslate::mark_raw(qq{<a href="$text">link to $text</a>});
                    },
                },
            )
        );
    }

    my $root = file(__FILE__)->dir->absolute->stringify;

    sub gen_app {
        my ($self, $action) = @_;

        enable "Static",
            path => qr/(?:css|html?|js)$/,
            root => "$root";

        my $app = sub {
            my $env = shift;
            my $req = Plack::Request->new($env);
            my $params = $req->parameters->as_hashref;
            my $html = "$action.html";
            my %var = $self->can($action) ? $self->$action($params) : ();
            my %stash = (%var, action => $action, params => $params,);
            my $body = utf->encode($self->xt->render($html, \%stash));
            return [
                '200',
                ['Content-Type' => 'text/html; charset=utf-8'],
                [$body],
            ];
        };
    }
}

{
    package main;
    use Path::Class;
    use Plack::App::CGIBin;
    use Plack::Builder;

    my $app = MyServer->new;
    $app->init;

    my $root = file(__FILE__)->dir->absolute->stringify;
    my $perl_js = Plack::App::CGIBin->new(root => "$root/perl_js")->to_app;

    builder {
        mount "/perl_js" => $perl_js;
        mount "/"        => builder { $app->gen_app("index") };
    };
}
